import { useCategories } from '@/hooks/useTimelines';
import { STATUS_OPTIONS } from '@/lib/constants';
import type { TimelineFilters, TimelineStatus } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  filters: TimelineFilters;
  onChange: (f: TimelineFilters) => void;
  hideStatus?: boolean;
}

export function Filters({ filters, onChange, hideStatus }: Props) {
  const { data: categories } = useCategories();

  const update = (patch: Partial<TimelineFilters>) => onChange({ ...filters, ...patch });

  const hasFilter = !!(
    filters.search || filters.status || filters.category || filters.from || filters.to
  );

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <Input
        className="max-w-xs"
        placeholder="Tìm theo tiêu đề hoặc mô tả…"
        value={filters.search ?? ''}
        onChange={(e) => update({ search: e.target.value || undefined })}
      />

      {!hideStatus && (
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={filters.status ?? ''}
          onChange={(e) =>
            update({ status: (e.target.value || undefined) as TimelineStatus | undefined })
          }
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      <select
        className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={filters.category ?? ''}
        onChange={(e) => update({ category: e.target.value || undefined })}
      >
        <option value="">Tất cả danh mục</option>
        {categories?.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <Input
        type="date"
        title="Từ ngày"
        className="w-auto"
        value={filters.from ?? ''}
        onChange={(e) => update({ from: e.target.value || undefined })}
      />
      <Input
        type="date"
        title="Đến ngày"
        className="w-auto"
        value={filters.to ?? ''}
        onChange={(e) => update({ to: e.target.value || undefined })}
      />

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          Xoá lọc
        </Button>
      )}
    </div>
  );
}
