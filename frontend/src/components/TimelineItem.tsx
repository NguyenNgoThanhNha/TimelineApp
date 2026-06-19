import { format } from 'date-fns';
import { STATUS_META, categoryColor } from '../lib/constants';
import { useDeleteTimeline } from '../hooks/useTimelines';
import { StatusBadge } from './StatusBadge';
import type { Timeline } from '../types/timeline';

function fmt(d?: string | null): string {
  if (!d) return '—';
  try {
    return format(new Date(d), 'dd/MM/yyyy');
  } catch {
    return '—';
  }
}

interface Props {
  item: Timeline;
  onEdit: (t: Timeline) => void;
  onDetail: (t: Timeline) => void;
}

export function TimelineItem({ item, onEdit, onDetail }: Props) {
  const del = useDeleteTimeline();
  const statusColor = STATUS_META[item.status].color;
  const catColor = categoryColor(item.category);

  const handleDelete = () => {
    if (window.confirm(`Xoá timeline "${item.title}"?`)) {
      del.mutate(item.id);
    }
  };

  return (
    <div className="timeline-item">
      <span className="timeline-dot" style={{ backgroundColor: statusColor }} />

      <div className="timeline-card" style={{ borderLeftColor: statusColor }}>
        <div className="card-top">
          <h3 className="card-title" onClick={() => onDetail(item)}>
            {item.title}
          </h3>
          <StatusBadge status={item.status} />
        </div>

        <div className="card-meta">
          <span
            className="cat-tag"
            style={{ backgroundColor: `${catColor}1a`, color: catColor }}
          >
            {item.category}
          </span>
          <span className="date-range">
            📅 {fmt(item.startDate)} → {fmt(item.endDate)}
          </span>
        </div>

        {item.description && <p className="card-desc">{item.description}</p>}

        <div className="card-actions">
          <button className="btn btn-sm" onClick={() => onDetail(item)}>
            Chi tiết
          </button>
          <button className="btn btn-sm" onClick={() => onEdit(item)}>
            Sửa
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={handleDelete}
            disabled={del.isPending}
          >
            {del.isPending ? 'Đang xoá…' : 'Xoá'}
          </button>
        </div>
      </div>
    </div>
  );
}
