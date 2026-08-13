import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  EnrichmentStatus,
  LearningStatus,
  Prisma,
  ReviewResult,
  VocabularyRelationType,
} from '@prisma/client';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { BulkCreateVocabularyDto } from '../dto/bulk-create-vocabulary.dto';
import { CreateVocabularyDto } from '../dto/create-vocabulary.dto';
import { QueryVocabularyDto, VocabularySort } from '../dto/query-vocabulary.dto';
import { ReviewVocabularyDto } from '../dto/review-vocabulary.dto';
import { UpdateVocabularyDto } from '../dto/update-vocabulary.dto';
import { WordNotFoundError, type EnrichedWord } from '../types/enriched-word';
import { addDays, dayKey, parseDayParam, vnDayStart } from '../vn-date.util';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { VocabularyEnrichmentService } from './vocabulary-enrichment.service';

const STATUS_KEYS = ['New', 'Learning', 'Familiar', 'Mastered'] as const;
const CEFR_KEYS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const DEFAULT_PAGE_SIZE = 20;
const REVIEW_QUEUE_SIZE = 50;
const HISTORY_DAYS = 30;

/** Dữ liệu đủ để vẽ card tóm tắt ở màn "Từ vựng hôm nay" và danh sách. */
const SUMMARY_INCLUDE = {
  pronunciations: true,
  meanings: {
    orderBy: { order: 'asc' },
    include: { examples: { orderBy: { order: 'asc' }, take: 1 } },
  },
  relations: { where: { relationType: VocabularyRelationType.Synonym }, take: 3 },
} satisfies Prisma.VocabularyInclude;

/** Dữ liệu đầy đủ cho trang chi tiết. */
const DETAIL_INCLUDE = {
  pronunciations: true,
  meanings: {
    orderBy: { order: 'asc' },
    include: { examples: { orderBy: { order: 'asc' } } },
  },
  relations: true,
} satisfies Prisma.VocabularyInclude;

@Injectable()
export class VocabularyService {
  private readonly logger = new Logger(VocabularyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichment: VocabularyEnrichmentService,
    private readonly srs: SpacedRepetitionService,
  ) {}

  /**
   * Từ vựng là dữ liệu cá nhân: KHÔNG có ngoại lệ cho Admin như ở Timeline.
   * Mọi truy vấn đều phải đi qua đây.
   */
  private ownerScope(user: CurrentUserPayload): Prisma.VocabularyWhereInput {
    return { userId: user.userId };
  }

  // ---------------------------------------------------------------- thêm từ

  /** Thêm một từ. Nếu đã có thì KHÔNG tạo bản ghi mới, chỉ báo lại cho người dùng. */
  async create(user: CurrentUserPayload, dto: CreateVocabularyDto) {
    const word = dto.word.trim();
    if (!word) throw new BadRequestException('Vui lòng nhập từ vựng');

    const learnedDate = this.resolveLearnedDate(dto.learnedDate);
    const existing = await this.prisma.vocabulary.findUnique({
      where: { userId_wordKey: { userId: user.userId, wordKey: word.toLowerCase() } },
      include: SUMMARY_INCLUDE,
    });

    if (existing) {
      return { isDuplicate: true, vocabulary: existing };
    }

    const created = await this.insert(user, word, learnedDate, dto.note);
    void this.enrichInBackground(created.id, created.word);

    return {
      isDuplicate: false,
      vocabulary: await this.prisma.vocabulary.findUnique({
        where: { id: created.id },
        include: SUMMARY_INCLUDE,
      }),
    };
  }

  /**
   * Thêm nhiều từ cùng lúc (mỗi dòng một từ). Trả về danh sách đã tạo và danh sách
   * đã tồn tại để frontend hỏi "đánh dấu là đã ôn lại hôm nay?".
   */
  async bulkCreate(user: CurrentUserPayload, dto: BulkCreateVocabularyDto) {
    const learnedDate = this.resolveLearnedDate(dto.learnedDate);

    // Trim, bỏ dòng trống, loại trùng ngay trong chính lô nhập (không phân biệt hoa/thường)
    const unique = new Map<string, string>();
    for (const raw of dto.words) {
      const word = raw.trim();
      if (!word) continue;
      const key = word.toLowerCase();
      if (!unique.has(key)) unique.set(key, word);
    }
    if (!unique.size) throw new BadRequestException('Vui lòng nhập ít nhất một từ');

    const existing = await this.prisma.vocabulary.findMany({
      where: { ...this.ownerScope(user), wordKey: { in: [...unique.keys()] } },
      select: { id: true, word: true, wordKey: true, learnedDate: true },
    });
    const existingKeys = new Set(existing.map((item) => item.wordKey));

    const createdIds: string[] = [];
    for (const [key, word] of unique) {
      if (existingKeys.has(key)) continue;
      const created = await this.insert(user, word, learnedDate);
      createdIds.push(created.id);
    }

    // Enrich tuần tự ở nền: không chặn response và không bắn hàng chục request cùng lúc
    void this.enrichQueue(createdIds);

    return {
      created: await this.prisma.vocabulary.findMany({
        where: { id: { in: createdIds } },
        include: SUMMARY_INCLUDE,
        orderBy: { createdAt: 'asc' },
      }),
      duplicates: existing.map((item) => ({
        id: item.id,
        word: item.word,
        learnedDate: item.learnedDate,
      })),
    };
  }

  private insert(user: CurrentUserPayload, word: string, learnedDate: Date, note?: string) {
    return this.prisma.vocabulary.create({
      data: {
        word,
        wordKey: word.toLowerCase(),
        learnedDate,
        // Từ mới thêm là tới hạn ôn ngay -> hàng đợi ôn tập không cần xử lý trường hợp "chưa có lịch"
        nextReviewDate: learnedDate,
        note: note?.trim() || null,
        // Lưu trước với Pending -> API từ điển lỗi cũng không làm mất từ user vừa nhập
        enrichmentStatus: EnrichmentStatus.Pending,
        userId: user.userId,
      },
    });
  }

  // ------------------------------------------------------------- enrichment

  private async enrichQueue(ids: string[]) {
    for (const id of ids) {
      const item = await this.prisma.vocabulary.findUnique({
        where: { id },
        select: { word: true },
      });
      if (item) await this.enrichInBackground(id, item.word);
    }
  }

  /** Không bao giờ ném lỗi ra ngoài — mọi thất bại đều ghi vào enrichmentStatus. */
  private async enrichInBackground(id: string, word: string) {
    try {
      const data = await this.enrichment.enrich(word);
      await this.applyEnrichment(id, data);
    } catch (error) {
      if (error instanceof WordNotFoundError) {
        await this.markEnrichmentFailed(id, this.notFoundMessage(error), error.suggestions);
      } else {
        this.logger.error(`Enrich "${word}" thất bại: ${(error as Error).message}`);
        await this.markEnrichmentFailed(id, (error as Error).message);
      }
    }
  }

  private notFoundMessage(error: WordNotFoundError): string {
    const base = `Không tìm thấy "${error.word}".`;
    return error.suggestions.length
      ? `${base} Có phải bạn muốn tìm: ${error.suggestions.join(', ')}?`
      : base;
  }

  /** Ghi dữ liệu từ điển vào DB — thay thế toàn bộ dữ liệu cũ của từ đó. */
  private async applyEnrichment(vocabularyId: string, data: EnrichedWord) {
    await this.clearEnrichedData(vocabularyId);

    if (data.pronunciations.length) {
      await this.prisma.vocabularyPronunciation.createMany({
        data: data.pronunciations.map((item) => ({ ...item, vocabularyId })),
      });
    }

    for (const [index, meaning] of data.meanings.entries()) {
      const created = await this.prisma.vocabularyMeaning.create({
        data: {
          vocabularyId,
          partOfSpeech: meaning.partOfSpeech,
          englishDefinition: meaning.englishDefinition,
          vietnameseMeaning: meaning.vietnameseMeaning,
          order: index,
        },
      });
      if (meaning.examples.length) {
        await this.prisma.vocabularyExample.createMany({
          data: meaning.examples.map((example, exampleIndex) => ({
            vocabularyMeaningId: created.id,
            englishSentence: example.englishSentence,
            vietnameseTranslation: example.vietnameseTranslation,
            difficultyLevel: example.difficultyLevel,
            order: exampleIndex,
          })),
        });
      }
    }

    if (data.relations.length) {
      await this.prisma.vocabularyRelation.createMany({
        data: data.relations.map((relation) => ({
          vocabularyId,
          relatedWord: relation.relatedWord,
          relatedWordKey: relation.relatedWord.toLowerCase(),
          relationType: relation.relationType,
          partOfSpeech: relation.partOfSpeech,
        })),
      });
    }

    await this.prisma.vocabulary.update({
      where: { id: vocabularyId },
      data: {
        // CEFR chỉ ghi khi có nguồn — không xoá giá trị người dùng đã tự đặt
        ...(data.cefrLevel ? { cefrLevel: data.cefrLevel } : {}),
        enrichmentStatus: EnrichmentStatus.Completed,
        enrichmentError: null,
        enrichmentSuggestions: [],
        enrichedAt: new Date(),
      },
    });
  }

  /** MongoDB không cascade: phải tự dọn con trước khi ghi lại. */
  private async clearEnrichedData(vocabularyId: string) {
    const meanings = await this.prisma.vocabularyMeaning.findMany({
      where: { vocabularyId },
      select: { id: true },
    });
    if (meanings.length) {
      await this.prisma.vocabularyExample.deleteMany({
        where: { vocabularyMeaningId: { in: meanings.map((m) => m.id) } },
      });
    }
    await this.prisma.vocabularyMeaning.deleteMany({ where: { vocabularyId } });
    await this.prisma.vocabularyPronunciation.deleteMany({ where: { vocabularyId } });
    await this.prisma.vocabularyRelation.deleteMany({ where: { vocabularyId } });
  }

  private markEnrichmentFailed(id: string, message: string, suggestions: string[] = []) {
    return this.prisma.vocabulary.update({
      where: { id },
      data: {
        enrichmentStatus: EnrichmentStatus.Failed,
        enrichmentError: message.slice(0, 500),
        enrichmentSuggestions: suggestions,
      },
    });
  }

  /**
   * "Refresh dictionary data" — điểm DUY NHẤT ngoài lần thêm đầu tiên gọi lại API bên ngoài.
   * Mở trang chi tiết luôn đọc từ database.
   */
  async refresh(user: CurrentUserPayload, id: string) {
    await this.getOwnedOrThrow(user, id);
    const current = await this.prisma.vocabulary.update({
      where: { id },
      data: { enrichmentStatus: EnrichmentStatus.Pending, enrichmentError: null },
    });

    await this.enrichInBackground(id, current.word);
    return this.findOne(user, id);
  }

  // ------------------------------------------------------------------ đọc

  async findAll(user: CurrentUserPayload, query: QueryVocabularyDto) {
    const where = this.buildWhere(user, query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.vocabulary.findMany({
        where,
        include: SUMMARY_INCLUDE,
        orderBy: this.buildOrderBy(query.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.vocabulary.count({ where }),
    ]);

    // Cùng khuôn phân trang với /api/posts
    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  private buildWhere(user: CurrentUserPayload, query: QueryVocabularyDto) {
    const where: Prisma.VocabularyWhereInput = { ...this.ownerScope(user) };

    if (query.search?.trim()) {
      const search = query.search.trim();
      // Tìm được cả theo từ tiếng Anh, nghĩa tiếng Việt và từ đồng nghĩa
      where.OR = [
        { word: { contains: search, mode: 'insensitive' } },
        { meanings: { some: { vietnameseMeaning: { contains: search, mode: 'insensitive' } } } },
        { relations: { some: { relatedWord: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    if (query.partOfSpeech) {
      where.meanings = { some: { partOfSpeech: query.partOfSpeech } };
    }
    if (query.cefrLevel) where.cefrLevel = query.cefrLevel;
    if (query.learningStatus) where.learningStatus = query.learningStatus;
    if (query.enrichmentStatus) where.enrichmentStatus = query.enrichmentStatus;

    const day = parseDayParam(query.date);
    if (day) where.learnedDate = day;

    return where;
  }

  private buildOrderBy(sort?: VocabularySort): Prisma.VocabularyOrderByWithRelationInput[] {
    switch (sort) {
      case VocabularySort.Oldest:
        return [{ learnedDate: 'asc' }, { createdAt: 'asc' }];
      case VocabularySort.Az:
        return [{ wordKey: 'asc' }];
      case VocabularySort.Za:
        return [{ wordKey: 'desc' }];
      default:
        return [{ learnedDate: 'desc' }, { createdAt: 'desc' }];
    }
  }

  /**
   * Chi tiết một từ. Synonym/antonym được đối chiếu với bộ từ của user để frontend
   * biết nên mở chi tiết hay mời "Thêm vào danh sách học".
   */
  async findOne(user: CurrentUserPayload, id: string) {
    await this.getOwnedOrThrow(user, id);
    const vocabulary = await this.prisma.vocabulary.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!vocabulary) throw new NotFoundException('Không tìm thấy từ vựng');

    const relatedKeys = vocabulary.relations.map((relation) => relation.relatedWordKey);
    const known = relatedKeys.length
      ? await this.prisma.vocabulary.findMany({
          where: { ...this.ownerScope(user), wordKey: { in: relatedKeys } },
          select: { id: true, wordKey: true },
        })
      : [];
    const knownMap = new Map(known.map((item) => [item.wordKey, item.id]));

    return {
      ...vocabulary,
      relations: vocabulary.relations.map((relation) => ({
        ...relation,
        // null = chưa học -> frontend cho phép thêm vào danh sách học (không tự thêm)
        relatedVocabularyId: knownMap.get(relation.relatedWordKey) ?? null,
      })),
    };
  }

  /** Danh sách từ đã học trong một ngày + số lượt ôn của ngày đó. */
  async daily(user: CurrentUserPayload, date?: string) {
    const day = parseDayParam(date) ?? vnDayStart();

    const [items, reviewedCount] = await Promise.all([
      this.prisma.vocabulary.findMany({
        where: { ...this.ownerScope(user), learnedDate: day },
        include: SUMMARY_INCLUDE,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.vocabularyReview.count({ where: { userId: user.userId, reviewDay: day } }),
    ]);

    return { date: day, learnedCount: items.length, reviewedCount, items };
  }

  /** Lịch sử theo ngày cho dashboard: 13/08/2026 — 8 từ. */
  async history(user: CurrentUserPayload, days = HISTORY_DAYS) {
    const from = addDays(vnDayStart(), -(days - 1));

    const [learned, reviews] = await Promise.all([
      this.prisma.vocabulary.findMany({
        where: { ...this.ownerScope(user), learnedDate: { gte: from } },
        select: { learnedDate: true },
      }),
      this.prisma.vocabularyReview.findMany({
        where: { userId: user.userId, reviewDay: { gte: from } },
        select: { reviewDay: true },
      }),
    ]);

    const buckets = new Map<string, { date: Date; learnedCount: number; reviewedCount: number }>();
    const bucket = (date: Date) => {
      const key = dayKey(date);
      if (!buckets.has(key)) buckets.set(key, { date, learnedCount: 0, reviewedCount: 0 });
      return buckets.get(key)!;
    };

    for (const item of learned) bucket(item.learnedDate).learnedCount++;
    for (const item of reviews) bucket(item.reviewDay).reviewedCount++;

    return [...buckets.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /** Số liệu cho dashboard: tổng quan, theo mốc thời gian và learning streak. */
  async statistics(user: CurrentUserPayload) {
    const [items, reviews, dueToday] = await Promise.all([
      this.prisma.vocabulary.findMany({
        where: this.ownerScope(user),
        select: { learningStatus: true, learnedDate: true, cefrLevel: true },
      }),
      this.prisma.vocabularyReview.findMany({
        where: { userId: user.userId },
        select: { reviewDay: true },
      }),
      this.prisma.vocabulary.count({ where: this.dueWhere(user) }),
    ]);

    const today = vnDayStart();
    const sevenDaysAgo = addDays(today, -6);
    const monthStart = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0, 0),
    );

    const byStatus: Record<string, number> = {};
    for (const key of STATUS_KEYS) byStatus[key] = 0;
    const byCefr: Record<string, number> = {};
    for (const key of CEFR_KEYS) byCefr[key] = 0;
    byCefr.Unknown = 0; // từ chưa xác định được trình độ

    let todayCount = 0;
    let last7Days = 0;
    let thisMonth = 0;

    for (const item of items) {
      byStatus[item.learningStatus] = (byStatus[item.learningStatus] ?? 0) + 1;
      byCefr[item.cefrLevel ?? 'Unknown'] += 1;
      const time = item.learnedDate.getTime();
      if (time === today.getTime()) todayCount++;
      if (time >= sevenDaysAgo.getTime()) last7Days++;
      if (time >= monthStart.getTime()) thisMonth++;
    }

    const reviewedToday = reviews.filter((r) => r.reviewDay.getTime() === today.getTime()).length;

    return {
      total: items.length,
      byStatus,
      byCefr,
      today: todayCount,
      reviewedToday,
      dueToday,
      last7Days,
      thisMonth,
      streak: this.calculateStreak(items.map((i) => i.learnedDate), reviews.map((r) => r.reviewDay)),
    };
  }

  /**
   * Streak: một ngày được tính nếu học ít nhất 1 từ mới HOẶC có ít nhất 1 lượt ôn.
   * Hôm nay chưa học thì đếm từ hôm qua để chuỗi không bị "đứt" giữa ngày.
   */
  private calculateStreak(learnedDates: Date[], reviewDays: Date[]): number {
    const activeDays = new Set<string>();
    for (const date of learnedDates) activeDays.add(dayKey(date));
    for (const date of reviewDays) activeDays.add(dayKey(date));
    if (!activeDays.size) return 0;

    const today = vnDayStart();
    let cursor = activeDays.has(dayKey(today)) ? today : addDays(today, -1);
    let streak = 0;

    while (activeDays.has(dayKey(cursor))) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  /** Tra nhanh xem một từ (vd synonym vừa click) đã nằm trong bộ từ của user chưa. */
  async lookup(user: CurrentUserPayload, word: string) {
    const trimmed = (word ?? '').trim();
    if (!trimmed) throw new BadRequestException('Vui lòng nhập từ cần tra');

    const found = await this.prisma.vocabulary.findUnique({
      where: { userId_wordKey: { userId: user.userId, wordKey: trimmed.toLowerCase() } },
      select: { id: true, word: true, learnedDate: true },
    });

    return { word: trimmed, exists: !!found, vocabulary: found };
  }

  // ------------------------------------------------------------------ sửa

  async update(user: CurrentUserPayload, id: string, dto: UpdateVocabularyDto) {
    await this.getOwnedOrThrow(user, id);
    return this.prisma.vocabulary.update({
      where: { id },
      data: {
        ...(dto.note !== undefined && { note: dto.note.trim() || null }),
        ...(dto.learningStatus !== undefined && { learningStatus: dto.learningStatus }),
        ...(dto.cefrLevel !== undefined && { cefrLevel: dto.cefrLevel }),
      },
    });
  }

  async remove(user: CurrentUserPayload, id: string) {
    await this.getOwnedOrThrow(user, id);
    await this.clearEnrichedData(id);
    await this.prisma.vocabularyReview.deleteMany({ where: { vocabularyId: id } });
    await this.prisma.vocabulary.delete({ where: { id } });
    return { id };
  }

  // --------------------------------------------------------------- ôn tập

  /** Lưu kết quả một lượt ôn và tính lịch ôn kế tiếp bằng SM-2. */
  async review(user: CurrentUserPayload, id: string, dto: ReviewVocabularyDto) {
    const current = await this.getOwnedOrThrow(user, id);
    const reviewedAt = new Date();

    const schedule = this.srs.schedule(
      {
        easeFactor: current.easeFactor,
        intervalDays: current.intervalDays,
        masteryLevel: current.masteryLevel,
      },
      dto.result,
      reviewedAt,
    );

    await this.prisma.vocabularyReview.create({
      data: {
        vocabularyId: id,
        userId: user.userId,
        reviewDate: reviewedAt,
        reviewDay: vnDayStart(reviewedAt),
        result: dto.result,
        nextReviewDate: schedule.nextReviewDate,
        intervalDays: schedule.intervalDays,
      },
    });

    return this.prisma.vocabulary.update({
      where: { id },
      data: {
        lastReviewDate: reviewedAt,
        nextReviewDate: schedule.nextReviewDate,
        reviewCount: { increment: 1 },
        ...(schedule.isCorrect
          ? { correctCount: { increment: 1 } }
          : { incorrectCount: { increment: 1 } }),
        masteryLevel: schedule.masteryLevel,
        easeFactor: schedule.easeFactor,
        intervalDays: schedule.intervalDays,
        learningStatus: schedule.learningStatus,
      },
    });
  }

  /** Dùng cho tình huống nhập lại một từ đã học: "đánh dấu là đã ôn lại hôm nay". */
  markReviewedToday(user: CurrentUserPayload, id: string) {
    return this.review(user, id, { result: ReviewResult.Good });
  }

  /**
   * Điều kiện "tới hạn ôn": đã tới ngày hẹn, hoặc chưa có lịch ôn và chưa thuộc.
   * Dùng chung cho hàng đợi flashcard và ô đếm dueToday trên dashboard.
   */
  private dueWhere(user: CurrentUserPayload): Prisma.VocabularyWhereInput {
    const endOfToday = addDays(vnDayStart(), 1);
    const notMastered = { learningStatus: { not: LearningStatus.Mastered } };

    return {
      ...this.ownerScope(user),
      enrichmentStatus: EnrichmentStatus.Completed,
      OR: [
        { nextReviewDate: { lt: endOfToday } },
        // MongoDB phân biệt "field = null" với "field chưa từng được ghi":
        // `null` KHÔNG khớp document thiếu hẳn field, nên phải bắt thêm isSet: false.
        { nextReviewDate: null, ...notMastered },
        { nextReviewDate: { isSet: false }, ...notMastered },
      ],
    };
  }

  /** Hàng đợi flashcard hôm nay. */
  async reviewToday(user: CurrentUserPayload) {
    const items = await this.prisma.vocabulary.findMany({
      where: this.dueWhere(user),
      include: DETAIL_INCLUDE,
      orderBy: [{ nextReviewDate: 'asc' }, { learnedDate: 'asc' }],
      take: REVIEW_QUEUE_SIZE,
    });

    return { data: items, totalRecord: items.length };
  }

  /** Lịch sử ôn tập của một từ — để xem thuật toán đã giãn cách ra sao. */
  async reviewHistory(user: CurrentUserPayload, id: string) {
    await this.getOwnedOrThrow(user, id);
    return this.prisma.vocabularyReview.findMany({
      where: { vocabularyId: id },
      orderBy: { reviewDate: 'desc' },
      take: 20,
    });
  }

  // ------------------------------------------------------------- tiện ích

  /** Không lộ sự tồn tại từ vựng của người khác -> trả 404 thay vì 403. */
  private async getOwnedOrThrow(user: CurrentUserPayload, id: string) {
    const item = await this.prisma.vocabulary.findUnique({ where: { id } });
    if (!item || item.userId !== user.userId) {
      throw new NotFoundException('Không tìm thấy từ vựng');
    }
    return item;
  }

  private resolveLearnedDate(value?: string): Date {
    const parsed = parseDayParam(value);
    if (value && !parsed) throw new BadRequestException('Ngày học không hợp lệ');
    return parsed ?? vnDayStart();
  }
}
