import { format } from 'date-fns';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { categoryColor } from '../lib/constants';
import type { Timeline } from '../types/timeline';

function fmt(d?: string | null): string {
  if (!d) return '—';
  try {
    return format(new Date(d), 'dd/MM/yyyy');
  } catch {
    return '—';
  }
}

function fmtDateTime(d?: string | null): string {
  if (!d) return '—';
  try {
    return format(new Date(d), 'dd/MM/yyyy HH:mm');
  } catch {
    return '—';
  }
}

interface Props {
  timeline: Timeline;
  onClose: () => void;
  onEdit: (t: Timeline) => void;
}

export function DetailModal({ timeline, onClose, onEdit }: Props) {
  const catColor = categoryColor(timeline.category);

  return (
    <Modal title="Chi tiết timeline" onClose={onClose}>
      <div className="detail">
        <h3 className="detail-title">{timeline.title}</h3>

        <div className="detail-row">
          <StatusBadge status={timeline.status} />
          <span
            className="cat-tag"
            style={{ backgroundColor: `${catColor}1a`, color: catColor }}
          >
            {timeline.category}
          </span>
        </div>

        <dl className="detail-grid">
          <dt>Bắt đầu</dt>
          <dd>{fmt(timeline.startDate)}</dd>
          <dt>Kết thúc</dt>
          <dd>{fmt(timeline.endDate)}</dd>
          <dt>Mô tả</dt>
          <dd>{timeline.description || '—'}</dd>
          <dt>Tạo lúc</dt>
          <dd>{fmtDateTime(timeline.createdAt)}</dd>
          <dt>Cập nhật</dt>
          <dd>{fmtDateTime(timeline.updatedAt)}</dd>
          <dt>ID</dt>
          <dd className="mono">{timeline.id}</dd>
        </dl>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Đóng
          </button>
          <button className="btn btn-primary" onClick={() => onEdit(timeline)}>
            Sửa
          </button>
        </div>
      </div>
    </Modal>
  );
}
