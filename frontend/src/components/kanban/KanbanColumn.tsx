import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Timeline, TimelineStatus } from '@/types/timeline';
import { STATUS_META } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { KanbanCard } from './KanbanCard';

interface Props {
  status: TimelineStatus;
  label: string;
  items: Timeline[];
  onDetail: (item: Timeline) => void;
  onEdit: (item: Timeline) => void;
  onDelete: (item: Timeline) => void;
}

export function KanbanColumn({ status, label, items, onDetail, onEdit, onDelete }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_META[status];

  return (
    <div
      className={cn(
        'glass-column flex w-72 shrink-0 flex-col rounded-xl transition-all duration-200',
        isOver && 'glass-column-over scale-[1.01]',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: meta.color }} />
          <h3 className="text-sm font-semibold">{label}</h3>
        </div>
        <Badge variant="secondary" className="tabular-nums">
          {items.length}
        </Badge>
      </div>

      <div ref={setNodeRef} className="flex min-h-[420px] flex-1 flex-col gap-2 p-2">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              onDetail={onDetail}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/30 p-4 text-center text-xs text-muted-foreground backdrop-blur-sm">
            Kéo thả card vào đây
          </div>
        )}
      </div>
    </div>
  );
}
