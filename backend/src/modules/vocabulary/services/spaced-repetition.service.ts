import { Injectable } from '@nestjs/common';
import { LearningStatus, ReviewResult } from '@prisma/client';
import { addDays, vnDayStart } from '../vn-date.util';

/** Trạng thái ôn tập hiện tại của một từ (phần SRS của Vocabulary). */
export interface SrsState {
  easeFactor: number;
  intervalDays: number;
  /** Số lần ôn đúng liên tiếp — chính là "repetition" của SM-2. */
  masteryLevel: number;
}

export interface SrsSchedule extends SrsState {
  nextReviewDate: Date;
  learningStatus: LearningStatus;
  isCorrect: boolean;
}

// SM-2 chấm điểm 0..5. Ánh xạ 4 nút của flashcard sang thang này.
const QUALITY: Record<ReviewResult, number> = {
  [ReviewResult.Again]: 0,
  [ReviewResult.Hard]: 3,
  [ReviewResult.Good]: 4,
  [ReviewResult.Easy]: 5,
};

const MIN_EASE_FACTOR = 1.3;
const MAX_INTERVAL_DAYS = 365;

/**
 * Thuật toán SM-2 rút gọn. Tách riêng khỏi VocabularyService để sau này
 * đổi sang FSRS/Leitner chỉ cần thay class này, không đụng tới CRUD hay database.
 */
@Injectable()
export class SpacedRepetitionService {
  schedule(state: SrsState, result: ReviewResult, reviewedAt: Date = new Date()): SrsSchedule {
    const quality = QUALITY[result];
    const isCorrect = quality >= 3;

    // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    const delta = 5 - quality;
    const easeFactor = Math.max(
      MIN_EASE_FACTOR,
      Number((state.easeFactor + (0.1 - delta * (0.08 + delta * 0.02))).toFixed(3)),
    );

    // Trả lời sai -> học lại từ đầu, ôn lại ngay ngày hôm sau
    const masteryLevel = isCorrect ? state.masteryLevel + 1 : 0;
    const intervalDays = isCorrect
      ? Math.min(this.nextInterval(masteryLevel, state.intervalDays, easeFactor), MAX_INTERVAL_DAYS)
      : 1;

    return {
      easeFactor,
      intervalDays,
      masteryLevel,
      nextReviewDate: addDays(vnDayStart(reviewedAt), intervalDays),
      learningStatus: this.toLearningStatus(masteryLevel),
      isCorrect,
    };
  }

  private nextInterval(masteryLevel: number, previousInterval: number, easeFactor: number): number {
    if (masteryLevel <= 1) return 1;
    if (masteryLevel === 2) return 6;
    return Math.max(1, Math.round(Math.max(previousInterval, 1) * easeFactor));
  }

  /**
   * Trạng thái học suy ra từ số lần đúng liên tiếp. Từ đã được ôn thì không
   * quay lại "New" nữa, kể cả khi trả lời sai.
   */
  private toLearningStatus(masteryLevel: number): LearningStatus {
    if (masteryLevel >= 5) return LearningStatus.Mastered;
    if (masteryLevel >= 3) return LearningStatus.Familiar;
    return LearningStatus.Learning;
  }
}
