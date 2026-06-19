import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { Calendar, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Timeline } from '@/types/timeline';
import { categoryColor } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  item: Timeline;
  isOverlay?: boolean;
  onDetail: (item: Timeline) => void;
  onEdit: (item: Timeline) => void;
  onDelete: (item: Timeline) => void;
}

function fmt(d?: string | null): string {
  if (!d) return '—';
  try {
    return format(new Date(d), 'dd/MM/yyyy');
  } catch {
    return '—';
  }
}

export function KanbanCard({ item, isOverlay, onDetail, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { status: item.status },
  });

  const catColor = categoryColor(item.category);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md',
        isDragging && 'opacity-40',
        isOverlay && 'rotate-2 shadow-xl ring-2 ring-primary/20',
      )}
      onClick={() => onDetail(item)}
    >
      <CardHeader className="space-y-2 p-3 pb-0">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            aria-label="Kéo thả"
          >
            <GripVertical className="size-4" />
          </button>
          <CardTitle className="line-clamp-2 flex-1 text-sm leading-snug">{item.title}</CardTitle>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
            >
              <MoreHorizontal className="size-4" />
            </Button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-10 min-w-[120px] rounded-md border bg-popover p-1 shadow-md"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(item);
                  }}
                >
                  <Pencil className="size-3.5" /> Sửa
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(item);
                  }}
                >
                  <Trash2 className="size-3.5" /> Xoá
                </button>
              </div>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-0 font-normal"
          style={{ backgroundColor: `${catColor}18`, color: catColor }}
        >
          {item.category}
        </Badge>
      </CardHeader>

      {item.description && (
        <CardContent className="px-3 py-2">
          <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        </CardContent>
      )}

      <CardFooter className="px-3 pb-3 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          <span>
            {fmt(item.startDate)}
            {item.endDate ? ` → ${fmt(item.endDate)}` : ''}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
