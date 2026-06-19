import type { Timeline } from '../types/timeline';
import { TimelineItem } from './TimelineItem';

interface Props {
  items: Timeline[];
  onEdit: (t: Timeline) => void;
  onDetail: (t: Timeline) => void;
}

// Hiển thị dạng vertical timeline. Xử lý cả empty state.
export function TimelineView({ items, onEdit, onDetail }: Props) {
  if (items.length === 0) {
    return (
      <div className="state-box empty">
        <div className="empty-icon">📭</div>
        <p>Chưa có timeline nào khớp.</p>
        <span className="empty-hint">Hãy thêm mốc mới hoặc đổi bộ lọc.</span>
      </div>
    );
  }

  return (
    <div className="timeline">
      {items.map((t) => (
        <TimelineItem key={t.id} item={t} onEdit={onEdit} onDetail={onDetail} />
      ))}
    </div>
  );
}
