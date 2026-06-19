import { format } from 'date-fns';
import { categoryColor, STATUS_META } from '@/lib/constants';
import type { Timeline } from '@/types/timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  open: boolean;
  timeline: Timeline | null;
  onClose: () => void;
  onEdit: (t: Timeline) => void;
}

export function DetailModal({ open, timeline, onClose, onEdit }: Props) {
  if (!timeline) return null;

  const catColor = categoryColor(timeline.category);
  const statusMeta = STATUS_META[timeline.status];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{timeline.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" style={{ borderColor: `${statusMeta.color}55`, color: statusMeta.color }}>
              {statusMeta.label}
            </Badge>
            <Badge
              variant="outline"
              className="border-0"
              style={{ backgroundColor: `${catColor}18`, color: catColor }}
            >
              {timeline.category}
            </Badge>
          </div>

          <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Bắt đầu</dt>
            <dd>{fmt(timeline.startDate)}</dd>
            <dt className="text-muted-foreground">Kết thúc</dt>
            <dd>{fmt(timeline.endDate)}</dd>
            <dt className="text-muted-foreground">Mô tả</dt>
            <dd>{timeline.description || '—'}</dd>
            <dt className="text-muted-foreground">Tạo lúc</dt>
            <dd>{fmtDateTime(timeline.createdAt)}</dd>
            <dt className="text-muted-foreground">Cập nhật</dt>
            <dd>{fmtDateTime(timeline.updatedAt)}</dd>
            <dt className="text-muted-foreground">ID</dt>
            <dd className="break-all font-mono text-xs text-muted-foreground">{timeline.id}</dd>
          </dl>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={() => onEdit(timeline)}>Sửa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
