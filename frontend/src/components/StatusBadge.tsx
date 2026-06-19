import { STATUS_META } from '../lib/constants';
import type { TimelineStatus } from '../types/timeline';

export function StatusBadge({ status }: { status: TimelineStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="badge"
      style={{ backgroundColor: `${meta.color}1a`, color: meta.color, borderColor: `${meta.color}55` }}
    >
      <span className="badge-dot" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}
