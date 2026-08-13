import { CalendarClock, History, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVocabularyReviews } from '@/hooks/useVocabulary';
import { REVIEW_RESULT_META } from '@/lib/vocabulary-constants';
import { formatVnDate } from '@/lib/vocabulary-format';
import type { Vocabulary } from '@/types/vocabulary';

/** SM-2 coi 5 lần đúng liên tiếp là đã thuộc. */
const MASTERY_TARGET = 5;

/**
 * Trạng thái spaced repetition của một từ: mức thành thạo, lịch ôn kế tiếp
 * và lịch sử các lượt đã ôn (thấy rõ khoảng cách được giãn ra thế nào).
 */
export function SrsPanel({ vocabulary }: { vocabulary: Vocabulary }) {
  const { data: reviews } = useVocabularyReviews(vocabulary.id);

  if (vocabulary.reviewCount === 0) {
    return (
      <Card className="glass-panel">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <CalendarClock className="size-4 shrink-0" />
          Chưa ôn lần nào — từ này đang nằm trong hàng đợi ôn tập.
        </CardContent>
      </Card>
    );
  }

  const accuracy = Math.round((vocabulary.correctCount / vocabulary.reviewCount) * 100);
  const masteryPct = Math.min(100, (vocabulary.masteryLevel / MASTERY_TARGET) * 100);

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="size-4" />
          Tiến độ ghi nhớ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Đúng {vocabulary.masteryLevel}/{MASTERY_TARGET} lần liên tiếp
            </span>
            <span className="font-semibold tabular-nums">{accuracy}% chính xác</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Số lượt ôn" value={String(vocabulary.reviewCount)} />
          <Stat label="Đúng / sai" value={`${vocabulary.correctCount} / ${vocabulary.incorrectCount}`} />
          <Stat label="Giãn cách" value={`${vocabulary.intervalDays} ngày`} />
          <Stat label="Ôn lại" value={formatVnDate(vocabulary.nextReviewDate)} />
        </div>

        {!!reviews?.length && (
          <div className="border-t border-border/40 pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <History className="size-3.5" />
              Lịch sử ôn
            </p>
            <div className="space-y-1">
              {reviews.map((entry) => {
                const meta = REVIEW_RESULT_META[entry.result];
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-muted-foreground">{formatVnDate(entry.reviewDay)}</span>
                    <span className="flex items-center gap-2">
                      <span style={{ color: meta.color }}>{meta.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        +{entry.intervalDays} ngày
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}
