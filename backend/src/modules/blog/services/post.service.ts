import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { estimateReadMinutes, slugify } from '../../../common/slug.util';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { QueryPostDto } from '../dto/query-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';

// Thông tin tác giả + task hiển thị kèm bài viết (không trả password, không trả cả cây)
const POST_LIST_INCLUDE = {
  author: { select: { id: true, name: true } },
  timelines: { select: { id: true, title: true, status: true, category: true } },
  _count: { select: { docs: true, resources: true } },
} satisfies Prisma.PostInclude;

const POST_DETAIL_INCLUDE = {
  author: { select: { id: true, name: true } },
  timelines: {
    select: { id: true, title: true, status: true, category: true, startDate: true, endDate: true },
  },
  docs: {
    select: { id: true, slug: true, title: true, summary: true, order: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  },
  resources: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.PostInclude;

const DEFAULT_PAGE_SIZE = 9;

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ai đọc được bài nào: bài đã publish thì mọi người đọc được,
   * bản nháp thì chỉ tác giả (và Admin) thấy.
   */
  private readScope(user: CurrentUserPayload): Prisma.PostWhereInput {
    if (user.role === 'Admin') return {};
    return { OR: [{ published: true }, { authorId: user.userId }] };
  }

  async findAll(user: CurrentUserPayload, query: QueryPostDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const filters: Prisma.PostWhereInput[] = [this.readScope(user)];

    if (query.search) {
      filters.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { summary: { contains: query.search, mode: 'insensitive' } },
          { content: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }
    if (query.category) {
      // Cho phép truyền cả tên ("Backend") lẫn slug ("backend")
      const all = await this.prisma.post.findMany({ select: { category: true }, distinct: ['category'] });
      const matched = all.map((r) => r.category).filter((c) => slugify(c) === slugify(query.category!));
      filters.push({ category: { in: matched.length ? matched : [query.category] } });
    }
    if (query.tag) filters.push({ tags: { has: query.tag } });
    if (query.series) {
      const names = await this.matchSeriesNames(query.series);
      filters.push({ series: { in: names } });
    }
    if (query.timelineId) filters.push({ timelineIds: { has: query.timelineId } });

    const where: Prisma.PostWhereInput = { AND: filters };

    // Xem theo chuỗi thì đọc từ kỳ 1 trở đi, còn lại là bài mới nhất trước
    const orderBy: Prisma.PostOrderByWithRelationInput[] = query.series
      ? [{ seriesOrder: 'asc' }, { publishedAt: 'asc' }]
      : [{ publishedAt: 'desc' }];

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: POST_LIST_INCLUDE,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: items.map((p) => this.stripContent(p)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** Chi tiết bài viết theo slug — kèm task liên quan, tài liệu, link ngoài và bài liên quan. */
  async findBySlug(user: CurrentUserPayload, slug: string) {
    const post = await this.prisma.post.findUnique({ where: { slug }, include: POST_DETAIL_INCLUDE });
    if (!post || (!post.published && post.authorId !== user.userId && user.role !== 'Admin')) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    // Đếm lượt xem (không chặn response nếu ghi lỗi)
    const views = post.views + 1;
    await this.prisma.post.update({ where: { id: post.id }, data: { views } }).catch(() => undefined);

    const [related, seriesNav] = await Promise.all([
      this.findRelated(user, post),
      this.findSeriesNav(user, post),
    ]);
    return { ...post, views, related, seriesNav };
  }

  /**
   * Điều hướng trong chuỗi bài: danh sách các kỳ + kỳ trước / kỳ sau.
   * Trả null nếu bài không thuộc chuỗi nào.
   */
  private async findSeriesNav(
    user: CurrentUserPayload,
    post: { id: string; series: string | null },
  ) {
    if (!post.series) return null;

    const items = await this.prisma.post.findMany({
      where: { AND: [this.readScope(user), { series: post.series }] },
      select: { id: true, slug: true, title: true, seriesOrder: true, published: true },
      orderBy: [{ seriesOrder: 'asc' }, { publishedAt: 'asc' }],
    });

    const index = items.findIndex((p) => p.id === post.id);
    return {
      name: post.series,
      slug: slugify(post.series),
      items,
      current: index + 1,
      total: items.length,
      prev: index > 0 ? items[index - 1] : null,
      next: index >= 0 && index < items.length - 1 ? items[index + 1] : null,
    };
  }

  /** Danh sách chuỗi bài kèm số kỳ — cho trang Chuỗi bài. */
  async getSeries(user: CurrentUserPayload) {
    const rows = await this.prisma.post.groupBy({
      by: ['series'],
      where: { AND: [this.readScope(user), { series: { not: null } }] },
      _count: { _all: true },
    });

    return rows
      .filter((r): r is typeof r & { series: string } => !!r.series)
      .map((r) => ({ name: r.series, slug: slugify(r.series), count: r._count._all }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  /** Bài liên quan: ưu tiên cùng chuyên mục hoặc trùng thẻ. */
  private async findRelated(user: CurrentUserPayload, post: { id: string; category: string; tags: string[] }) {
    const items = await this.prisma.post.findMany({
      where: {
        AND: [
          this.readScope(user),
          { id: { not: post.id } },
          { OR: [{ category: post.category }, { tags: { hasSome: post.tags } }] },
        ],
      },
      include: POST_LIST_INCLUDE,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
    return items.map((p) => this.stripContent(p));
  }

  async create(user: CurrentUserPayload, dto: CreatePostDto) {
    const slug = await this.uniqueSlug(dto.slug || dto.title);
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    const isScheduled = this.isFuture(scheduledAt);

    return this.prisma.post.create({
      data: {
        slug,
        title: dto.title.trim(),
        summary: dto.summary?.trim() || null,
        content: dto.content,
        coverImage: dto.coverImage?.trim() || null,
        category: dto.category.trim(),
        tags: this.normalizeTags(dto.tags),
        series: dto.series?.trim() || null,
        seriesOrder: dto.series?.trim() ? dto.seriesOrder ?? null : null,
        // Hẹn giờ ở tương lai -> giữ nháp, job nền sẽ đăng khi tới hạn
        published: isScheduled ? false : dto.published ?? true,
        scheduledAt: isScheduled ? scheduledAt : null,
        readMinutes: estimateReadMinutes(dto.content),
        authorId: user.userId,
        ...(dto.timelineIds?.length && {
          timelines: { connect: dto.timelineIds.map((id) => ({ id })) },
        }),
      },
      include: POST_LIST_INCLUDE,
    });
  }

  async update(user: CurrentUserPayload, id: string, dto: UpdatePostDto) {
    const current = await this.getEditableOrThrow(user, id);

    const data: Prisma.PostUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title.trim() }),
      ...(dto.summary !== undefined && { summary: dto.summary?.trim() || null }),
      ...(dto.content !== undefined && {
        content: dto.content,
        readMinutes: estimateReadMinutes(dto.content),
      }),
      ...(dto.coverImage !== undefined && { coverImage: dto.coverImage?.trim() || null }),
      ...(dto.category !== undefined && { category: dto.category.trim() }),
      ...(dto.tags !== undefined && { tags: this.normalizeTags(dto.tags) }),
      ...(dto.published !== undefined && { published: dto.published }),
    };

    // Gỡ chuỗi thì bỏ luôn số thứ tự để không còn kỳ mồ côi
    if (dto.series !== undefined) {
      const series = dto.series?.trim() || null;
      data.series = series;
      data.seriesOrder = series ? dto.seriesOrder ?? current.seriesOrder ?? null : null;
    } else if (dto.seriesOrder !== undefined) {
      data.seriesOrder = current.series ? dto.seriesOrder : null;
    }

    if (dto.slug !== undefined && slugify(dto.slug) !== current.slug) {
      data.slug = await this.uniqueSlug(dto.slug);
    }

    // Lịch đăng: hẹn giờ tương lai thì quay về nháp, gỡ lịch hoặc đăng tay thì huỷ hẹn
    if (dto.scheduledAt !== undefined) {
      const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
      if (this.isFuture(scheduledAt)) {
        data.scheduledAt = scheduledAt;
        data.published = false;
      } else {
        data.scheduledAt = null;
      }
    }
    if (dto.published === true && !this.isFuture(data.scheduledAt as Date | null)) {
      data.published = true;
      data.scheduledAt = null;
    }

    // Gắn/bỏ task: gửi mảng mới là thay thế toàn bộ liên kết hiện tại
    if (dto.timelineIds !== undefined) {
      data.timelines = { set: dto.timelineIds.map((tid) => ({ id: tid })) };
    }

    return this.prisma.post.update({ where: { id }, data, include: POST_LIST_INCLUDE });
  }

  async remove(user: CurrentUserPayload, id: string) {
    await this.getEditableOrThrow(user, id);
    // MongoDB không cascade: phải tự gỡ mọi tham chiếu trước khi xoá bài
    await this.prisma.post.update({ where: { id }, data: { timelines: { set: [] } } });
    await this.prisma.doc.updateMany({ where: { postId: id }, data: { postId: null } });
    // Link ngoài chỉ thuộc riêng bài viết thì xoá luôn, link dùng chung với task thì chỉ gỡ
    await this.prisma.resource.deleteMany({ where: { postId: id, timelineId: null } });
    await this.prisma.resource.updateMany({ where: { postId: id }, data: { postId: null } });
    await this.prisma.post.delete({ where: { id } });
    return { id };
  }

  /** Hàng đợi bài đã hẹn giờ nhưng chưa tới hạn — hiển thị ở trang blog cho tác giả. */
  async findScheduled(user: CurrentUserPayload) {
    const items = await this.prisma.post.findMany({
      where: {
        published: false,
        scheduledAt: { not: null },
        ...(user.role === 'Admin' ? {} : { authorId: user.userId }),
      },
      include: POST_LIST_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    });
    return items.map((p) => this.stripContent(p));
  }

  /** Đăng ngay một bài đang hẹn giờ / đang nháp, không chờ job nền. */
  async publishNow(user: CurrentUserPayload, id: string) {
    await this.getEditableOrThrow(user, id);
    const post = await this.prisma.post.update({
      where: { id },
      data: { published: true, publishedAt: new Date(), scheduledAt: null },
      include: POST_LIST_INCLUDE,
    });
    return this.stripContent(post);
  }

  /** Danh sách chuyên mục kèm số bài — dùng cho trang Chuyên mục và bộ lọc. */
  async getCategories(user: CurrentUserPayload) {
    const rows = await this.prisma.post.groupBy({
      by: ['category'],
      where: this.readScope(user),
      _count: { _all: true },
    });
    return rows
      .map((r) => ({ name: r.category, slug: slugify(r.category), count: r._count._all }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  /**
   * Thống kê thói quen ghi chép cho Dashboard: số bài, chuỗi ngày viết liên tiếp
   * và những task đang học nhưng chưa có bài/tài liệu nào.
   */
  async getWritingStats(user: CurrentUserPayload) {
    const mine = user.role === 'Admin' ? {} : { authorId: user.userId };

    const [posts, docCount, timelines, docsByTimeline] = await Promise.all([
      this.prisma.post.findMany({
        where: mine,
        select: { published: true, scheduledAt: true, publishedAt: true, timelineIds: true },
      }),
      this.prisma.doc.count({
        where: user.role === 'Admin' ? {} : { ownerId: user.userId },
      }),
      this.prisma.timeline.findMany({
        where: {
          ...(user.role === 'Admin' ? {} : { userId: user.userId }),
          status: { in: ['InProgress', 'Planned'] },
        },
        select: { id: true, title: true, category: true, status: true },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.doc.findMany({
        where: { ...(user.role === 'Admin' ? {} : { ownerId: user.userId }), timelineId: { not: null } },
        select: { timelineId: true },
      }),
    ]);

    const published = posts.filter((p) => p.published);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Task đã có ít nhất một bài viết hoặc một trang tài liệu
    const covered = new Set<string>();
    posts.forEach((p) => p.timelineIds.forEach((id) => covered.add(id)));
    docsByTimeline.forEach((d) => d.timelineId && covered.add(d.timelineId));

    return {
      totalPosts: posts.length,
      publishedPosts: published.length,
      draftPosts: posts.filter((p) => !p.published && !p.scheduledAt).length,
      scheduledPosts: posts.filter((p) => !p.published && !!p.scheduledAt).length,
      totalDocs: docCount,
      postsThisMonth: published.filter((p) => p.publishedAt >= startOfMonth).length,
      writingStreak: this.calcStreak(published.map((p) => p.publishedAt)),
      tasksWithoutContent: timelines.filter((t) => !covered.has(t.id)).slice(0, 8),
      tasksWithoutContentTotal: timelines.filter((t) => !covered.has(t.id)).length,
    };
  }

  /** Khoá ngày theo giờ máy chủ (không dùng ISO/UTC để không lệch ngày ở múi giờ +07). */
  private dayKey(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  /** Số ngày viết liên tiếp tính lùi từ hôm nay (hôm nay chưa viết thì tính từ hôm qua). */
  private calcStreak(dates: Date[]): number {
    if (!dates.length) return 0;

    const days = new Set(dates.map((d) => this.dayKey(new Date(d))));
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    // Chưa viết hôm nay vẫn giữ chuỗi nếu hôm qua có viết
    if (!days.has(this.dayKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    while (days.has(this.dayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  /** Danh sách thẻ kèm số bài (tags là mảng nên gom trong bộ nhớ). */
  async getTags(user: CurrentUserPayload) {
    const rows = await this.prisma.post.findMany({
      where: this.readScope(user),
      select: { tags: true },
    });
    const counter = new Map<string, number>();
    for (const row of rows) {
      for (const tag of row.tags) counter.set(tag, (counter.get(tag) ?? 0) + 1);
    }
    return [...counter.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  // ----- helpers -----

  /** Bỏ `content` khỏi payload danh sách cho nhẹ (card chỉ cần summary). */
  private stripContent<T extends { content: string }>(post: T): Omit<T, 'content'> {
    const { content: _content, ...rest } = post;
    return rest;
  }

  /** Cho phép lọc chuỗi bằng cả tên ("99 Ngày .NET") lẫn slug ("99-ngay-net"). */
  private async matchSeriesNames(value: string): Promise<string[]> {
    const rows = await this.prisma.post.findMany({
      where: { series: { not: null } },
      select: { series: true },
      distinct: ['series'],
    });
    const target = slugify(value);
    const matched = rows
      .map((r) => r.series)
      .filter((name): name is string => !!name && slugify(name) === target);
    return matched.length ? matched : [value];
  }

  /** Thời điểm hẹn có nằm ở tương lai không (quá khứ = đăng luôn). */
  private isFuture(value?: Date | null): boolean {
    return !!value && value.getTime() > Date.now();
  }

  private normalizeTags(tags?: string[]): string[] {
    if (!tags) return [];
    const cleaned = tags.map((t) => slugify(t)).filter(Boolean);
    return [...new Set(cleaned)];
  }

  private async getEditableOrThrow(user: CurrentUserPayload, id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (post.authorId !== user.userId && user.role !== 'Admin') {
      throw new ForbiddenException('Bạn không phải tác giả của bài viết này');
    }
    return post;
  }

  /** Slug phải là duy nhất — trùng thì thêm hậu tố -2, -3… */
  private async uniqueSlug(source: string): Promise<string> {
    const base = slugify(source) || 'bai-viet';
    let candidate = base;
    for (let i = 2; await this.prisma.post.findUnique({ where: { slug: candidate } }); i++) {
      candidate = `${base}-${i}`;
    }
    return candidate;
  }
}
