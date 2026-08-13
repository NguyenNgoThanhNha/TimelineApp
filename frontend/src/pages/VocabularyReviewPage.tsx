import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, PartyPopper, RotateCcw, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Flashcard } from '@/components/vocabulary/Flashcard';
import { VocabularyNav } from '@/components/vocabulary/VocabularyNav';
import { useReviewQueue, useReviewVocabulary } from '@/hooks/useVocabulary';
import { REVIEW_RESULT_META } from '@/lib/vocabulary-constants';
import { formatVnDate } from '@/lib/vocabulary-format';
import type { ReviewResult } from '@/types/vocabulary';

interface SessionEntry {
  word: string;
  result: ReviewResult;
  nextReviewDate?: string | null;
  intervalDays: number;
}

export function VocabularyReviewPage() {
  const { data: queue, isLoading, refetch, isRefetching } = useReviewQueue();
  const review = useReviewVocabulary();

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [log, setLog] = useState<SessionEntry[]>([]);

  const current = queue?.[index];
  const total = queue?.length ?? 0;
  const finished = total > 0 && index >= total;

  const rate = useCallback(
    async (result: ReviewResult) => {
      if (!current || review.isPending) return;
      const updated = await review.mutateAsync({ id: current.id, result });
      setLog((entries) => [
        ...entries,
        {
          word: current.word,
          result,
          nextReviewDate: updated.nextReviewDate,
          intervalDays: updated.intervalDays,
        },
      ]);
      setRevealed(false);
      setIndex((value) => value + 1);
    },
    [current, review],
  );

  const skip = useCallback(() => {
    setRevealed(false);
    setIndex((value) => value + 1);
  }, []);

  // Phím tắt: Space/Enter để lật thẻ, 1-4 để chấm điểm
  useEffect(() => {
    const RATINGS: ReviewResult[] = ['Again', 'Hard', 'Good', 'Easy'];

    const onKeyDown = (event: KeyboardEvent) => {
      if (!current) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (!revealed && (event.code === 'Space' || event.key === 'Enter')) {
        event.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed && ['1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault();
        void rate(RATINGS[Number(event.key) - 1]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, revealed, rate]);

  const restart = async () => {
    setIndex(0);
    setRevealed(false);
    setLog([]);
    await refetch();
  };

  const correctCount = useMemo(
    () => log.filter((entry) => entry.result !== 'Again').length,
    [log],
  );

  if (isLoading) {
    return (
      <>
        <VocabularyNav />
        <Card className="glass-panel">
          <CardContent className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
            <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            Đang tải hàng đợi ôn tập…
          </CardContent>
        </Card>
      </>
    );
  }

  // Không có gì để ôn
  if (!total) {
    return (
      <>
        <VocabularyNav />
        <Card className="glass-panel">
          <CardContent className="space-y-4 py-20 text-center">
            <CheckCircle2 className="mx-auto size-10 text-green-500" />
            <div>
              <p className="text-lg font-semibold">Hôm nay không còn từ nào cần ôn</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Thêm từ mới, hoặc quay lại khi tới lịch ôn kế tiếp.
              </p>
            </div>
            <Button asChild>
              <Link to="/tu-vung">Thêm từ mới</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  // Kết thúc phiên
  if (finished) {
    return (
      <>
        <VocabularyNav />
        <Card className="glass-panel">
          <CardContent className="space-y-6 py-12">
            <div className="text-center">
              <PartyPopper className="mx-auto size-10 text-primary" />
              <p className="mt-3 text-lg font-semibold">Xong phiên ôn</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Đã ôn {log.length}/{total} thẻ · nhớ được {correctCount}
              </p>
            </div>

            <div className="mx-auto max-w-md space-y-1">
              {log.map((entry, i) => {
                const meta = REVIEW_RESULT_META[entry.result];
                return (
                  <div
                    key={`${entry.word}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-1.5 text-sm"
                  >
                    <span className="font-medium">{entry.word}</span>
                    <span className="flex items-center gap-2">
                      <span style={{ color: meta.color }}>{meta.label}</span>
                      <span className="text-xs text-muted-foreground">
                        ôn lại {formatVnDate(entry.nextReviewDate)} ({entry.intervalDays} ngày)
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={restart} disabled={isRefetching}>
                <RotateCcw className={isRefetching ? 'size-4 animate-spin' : 'size-4'} />
                Ôn tiếp
              </Button>
              <Button asChild>
                <Link to="/tu-vung/thong-ke">Xem thống kê</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <VocabularyNav />

      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="tabular-nums">
            Thẻ {index + 1} / {total}
          </span>
          <Button variant="ghost" size="sm" onClick={skip} disabled={review.isPending}>
            <SkipForward className="size-4" />
            Bỏ qua
          </Button>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>

        {current && (
          <Flashcard
            key={current.id}
            vocabulary={current}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onRate={rate}
            disabled={review.isPending}
          />
        )}

        <p className="text-center text-xs text-muted-foreground">
          Phím tắt: <kbd className="rounded border px-1">Space</kbd> hiện đáp án ·{' '}
          <kbd className="rounded border px-1">1</kbd>–<kbd className="rounded border px-1">4</kbd>{' '}
          chấm điểm
        </p>
      </div>
    </>
  );
}
