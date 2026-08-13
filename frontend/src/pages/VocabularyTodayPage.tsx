import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Flame, ListChecks, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DuplicateWordsDialog } from '@/components/vocabulary/DuplicateWordsDialog';
import { VocabularyCard } from '@/components/vocabulary/VocabularyCard';
import { VocabularyNav } from '@/components/vocabulary/VocabularyNav';
import {
  useBulkAddVocabulary,
  useDailyVocabulary,
  useMarkReviewed,
  useVocabularyHistory,
  useVocabularyStatistics,
} from '@/hooks/useVocabulary';
import { formatVnDate, toDateParam, vnToday } from '@/lib/vocabulary-format';
import type { DuplicateVocabulary } from '@/types/vocabulary';

/** Tách textarea thành danh sách từ: mỗi dòng (hoặc dấu phẩy) một từ, tự trim, bỏ trùng. */
function parseWords(input: string): string[] {
  const seen = new Set<string>();
  const words: string[] = [];

  for (const raw of input.split(/[\n,;]+/)) {
    const word = raw.trim();
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(word);
  }
  return words;
}

export function VocabularyTodayPage() {
  const [input, setInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(vnToday());
  const [duplicates, setDuplicates] = useState<DuplicateVocabulary[]>([]);

  const daily = useDailyVocabulary(selectedDate);
  const stats = useVocabularyStatistics();
  const history = useVocabularyHistory();
  const bulkAdd = useBulkAddVocabulary();
  const markReviewed = useMarkReviewed();

  const words = useMemo(() => parseWords(input), [input]);
  const isToday = selectedDate === vnToday();

  // Người dùng chọn ngày khác -> đóng hộp thoại trùng đang mở cho ngày cũ
  useEffect(() => setDuplicates([]), [selectedDate]);

  const submit = async () => {
    if (!words.length) return;
    const result = await bulkAdd.mutateAsync(words);
    setInput('');
    if (result.duplicates.length) setDuplicates(result.duplicates);
  };

  const confirmMarkReviewed = async (ids: string[]) => {
    for (const id of ids) await markReviewed.mutateAsync(id);
    setDuplicates([]);
  };

  return (
    <>
      <VocabularyNav />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" />
              Từ vựng hôm nay
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Nhập một từ, hoặc nhiều từ cùng lúc — mỗi từ một dòng.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                // Ctrl/Cmd + Enter để thêm nhanh mà không cần rời bàn phím
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void submit();
              }}
              rows={5}
              spellCheck={false}
              placeholder={'achieve\nmaintain\nsignificant\napproach'}
              className="w-full resize-y rounded-lg border border-input/70 bg-background/50 p-3 font-mono text-sm shadow-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {words.length ? `${words.length} từ sẵn sàng thêm` : 'Chưa có từ nào'}
              </p>
              <Button onClick={submit} disabled={!words.length || bulkAdd.isPending}>
                <Plus className="size-4" />
                {bulkAdd.isPending ? 'Đang thêm…' : 'Thêm'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass-panel">
            <CardContent className="space-y-3 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Hôm nay</p>
              <p className="text-lg font-semibold">{formatVnDate(new Date().toISOString())}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.data?.today ?? 0}</p>
                  <p className="text-muted-foreground">từ đã học</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.data?.reviewedToday ?? 0}</p>
                  <p className="text-muted-foreground">lượt đã ôn</p>
                </div>
              </div>
              <p className="flex items-center gap-2 border-t border-border/40 pt-3 text-sm">
                <Flame className="size-4 text-orange-500" />
                <span className="font-semibold tabular-nums">{stats.data?.streak ?? 0} ngày</span>
                <span className="text-muted-foreground">liên tục</span>
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="size-4" />
                Lịch sử học
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-72 space-y-1 overflow-y-auto p-2">
              {!history.data?.length && (
                <p className="p-2 text-sm text-muted-foreground">Chưa có dữ liệu.</p>
              )}
              {history.data?.map((entry) => {
                const key = toDateParam(entry.date);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(key)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                      key === selectedDate ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    <span>{formatVnDate(entry.date)}</span>
                    <span className="text-muted-foreground">
                      {entry.learnedCount} từ
                      {entry.reviewedCount > 0 && ` · ${entry.reviewedCount} ôn`}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {isToday ? 'Đã học hôm nay' : `Đã học ngày ${formatVnDate(selectedDate)}`}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {daily.data?.learnedCount ?? 0} từ
            {(daily.data?.reviewedCount ?? 0) > 0 && ` · ${daily.data?.reviewedCount} lượt ôn`}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(vnToday())}>
              Về hôm nay
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/tu-vung/danh-sach">
              <ListChecks className="size-4" />
              Toàn bộ từ vựng
            </Link>
          </Button>
        </div>
      </div>

      {daily.isLoading ? (
        <Card className="glass-panel">
          <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            Đang tải…
          </CardContent>
        </Card>
      ) : !daily.data?.items.length ? (
        <Card className="glass-panel">
          <CardContent className="py-16 text-center text-muted-foreground">
            Chưa có từ nào cho ngày này.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {daily.data.items.map((item, index) => (
            <VocabularyCard
              key={item.id}
              vocabulary={item}
              index={index}
              onSuggestionClick={(word) => setInput((current) => (current ? `${current}\n${word}` : word))}
            />
          ))}
        </div>
      )}

      <DuplicateWordsDialog
        duplicates={duplicates}
        open={duplicates.length > 0}
        onOpenChange={(open) => !open && setDuplicates([])}
        onMarkReviewed={confirmMarkReviewed}
        isPending={markReviewed.isPending}
      />
    </>
  );
}
