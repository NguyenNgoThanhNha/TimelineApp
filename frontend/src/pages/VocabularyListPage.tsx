import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { VocabularyCard } from '@/components/vocabulary/VocabularyCard';
import { VocabularyNav } from '@/components/vocabulary/VocabularyNav';
import { useVocabularies } from '@/hooks/useVocabulary';
import {
  CEFR_LEVELS,
  LEARNING_STATUS_OPTIONS,
  PART_OF_SPEECH_OPTIONS,
  SORT_OPTIONS,
} from '@/lib/vocabulary-constants';
import type { VocabularyFilters } from '@/types/vocabulary';

const PAGE_SIZE = 24;
const SELECT_CLASS =
  'flex h-9 rounded-md border border-input/70 bg-background/50 px-3 text-sm shadow-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function VocabularyListPage() {
  // Cho phép nhảy từ lịch sử học sang đây kèm bộ lọc ngày: /tu-vung/danh-sach?date=2026-08-13
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<VocabularyFilters>({
    sort: 'recent',
    page: 1,
    pageSize: PAGE_SIZE,
    date: searchParams.get('date') ?? undefined,
  });
  const { data, isLoading, isError, error } = useVocabularies(filters);

  // Đổi bộ lọc thì luôn quay về trang 1
  const update = (patch: Partial<VocabularyFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  const hasFilter = !!(
    filters.search ||
    filters.partOfSpeech ||
    filters.cefrLevel ||
    filters.learningStatus ||
    filters.date
  );

  return (
    <>
      <VocabularyNav />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Từ vựng của tôi</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} từ</p>
        </div>
        <Button asChild>
          <Link to="/tu-vung">
            <Plus className="size-4" />
            Thêm từ mới
          </Link>
        </Button>
      </div>

      <div className="glass-panel mb-6 flex flex-wrap items-center gap-2 rounded-xl p-3">
        <Input
          className="max-w-xs border-border/60 bg-background/50 backdrop-blur-sm"
          placeholder="Tìm theo từ, nghĩa tiếng Việt hoặc synonym…"
          value={filters.search ?? ''}
          onChange={(event) => update({ search: event.target.value || undefined })}
        />

        <select
          className={SELECT_CLASS}
          value={filters.partOfSpeech ?? ''}
          onChange={(event) =>
            update({ partOfSpeech: (event.target.value || undefined) as VocabularyFilters['partOfSpeech'] })
          }
        >
          <option value="">Tất cả loại từ</option>
          {PART_OF_SPEECH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className={SELECT_CLASS}
          value={filters.cefrLevel ?? ''}
          onChange={(event) =>
            update({ cefrLevel: (event.target.value || undefined) as VocabularyFilters['cefrLevel'] })
          }
        >
          <option value="">Tất cả CEFR</option>
          {CEFR_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        <select
          className={SELECT_CLASS}
          value={filters.learningStatus ?? ''}
          onChange={(event) =>
            update({
              learningStatus: (event.target.value || undefined) as VocabularyFilters['learningStatus'],
            })
          }
        >
          <option value="">Tất cả trạng thái</option>
          {LEARNING_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          className={SELECT_CLASS}
          value={filters.date ?? ''}
          onChange={(event) => update({ date: event.target.value || undefined })}
        />

        <select
          className={SELECT_CLASS}
          value={filters.sort ?? 'recent'}
          onChange={(event) => update({ sort: event.target.value as VocabularyFilters['sort'] })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ sort: filters.sort, page: 1, pageSize: PAGE_SIZE })}
          >
            <X className="size-4" />
            Xoá lọc
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card className="glass-panel">
          <CardContent className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
            <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            Đang tải…
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="glass-panel border-destructive/30 bg-destructive/5">
          <CardContent className="py-8 text-center text-destructive">
            {(error as Error)?.message}
          </CardContent>
        </Card>
      ) : !data?.items.length ? (
        <Card className="glass-panel">
          <CardContent className="py-24 text-center text-muted-foreground">
            Không có từ nào khớp bộ lọc.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((item, index) => (
              <VocabularyCard key={item.id} vocabulary={item} index={index} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => update({ page: data.page - 1 })}
              >
                <ChevronLeft className="size-4" />
                Trước
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {data.page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => update({ page: data.page + 1 })}
              >
                Sau
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
