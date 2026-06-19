import { useCategories } from '../hooks/useTimelines';
import { STATUS_OPTIONS } from '../lib/constants';
import type { TimelineFilters, TimelineStatus } from '../types/timeline';

interface Props {
  filters: TimelineFilters;
  onChange: (f: TimelineFilters) => void;
}

export function Filters({ filters, onChange }: Props) {
  const { data: categories } = useCategories();

  const update = (patch: Partial<TimelineFilters>) => onChange({ ...filters, ...patch });

  const hasFilter = !!(
    filters.search || filters.status || filters.category || filters.from || filters.to
  );

  return (
    <div className="filters">
      <input
        className="input input-search"
        placeholder="🔍 Tìm theo tiêu đề hoặc mô tả..."
        value={filters.search ?? ''}
        onChange={(e) => update({ search: e.target.value || undefined })}
      />

      <select
        className="input"
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

      <select
        className="input"
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

      <input
        className="input"
        type="date"
        title="Từ ngày"
        value={filters.from ?? ''}
        onChange={(e) => update({ from: e.target.value || undefined })}
      />
      <input
        className="input"
        type="date"
        title="Đến ngày"
        value={filters.to ?? ''}
        onChange={(e) => update({ to: e.target.value || undefined })}
      />

      {hasFilter && (
        <button className="btn btn-ghost" onClick={() => onChange({})}>
          Xoá lọc
        </button>
      )}
    </div>
  );
}
