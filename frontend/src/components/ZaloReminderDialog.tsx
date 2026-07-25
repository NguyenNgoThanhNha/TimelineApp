import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { BellRing, CheckSquare, Square } from 'lucide-react';
import { useSendZaloReminders } from '@/hooks/useTimelines';
import { STATUS_META, categoryColor } from '@/lib/constants';
import type { Timeline } from '@/types/timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  items: Timeline[];
  onOpenChange: (open: boolean) => void;
}

function fmt(value?: string | null) {
  if (!value) return 'Không có ngày';
  try {
    return format(new Date(value), 'dd/MM/yyyy');
  } catch {
    return 'Không có ngày';
  }
}

export function ZaloReminderDialog({ open, items, onOpenChange }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const sendReminders = useSendZaloReminders();

  const selectableItems = useMemo(
    () => items.filter((item) => item.status !== 'Completed' && item.status !== 'Cancelled'),
    [items],
  );

  useEffect(() => {
    if (open) setSelectedIds([]);
  }, [open]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = selectableItems.length > 0 && selectedIds.length === selectableItems.length;

  const toggle = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : selectableItems.map((item) => item.id));
  };

  const handleSend = () => {
    sendReminders.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedIds([]);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="size-5 text-primary" />
            Nhắc lịch qua Zalo
          </DialogTitle>
          <DialogDescription>
            Chọn một hoặc nhiều task cần gửi nhắc lịch. Các task đã hoàn thành hoặc đã hủy sẽ không hiển thị ở đây.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Đã chọn {selectedIds.length} task</p>
              <p className="text-xs text-muted-foreground">
                Tin nhắn sẽ được gửi đến chat Zalo đã cấu hình trong backend.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={selectableItems.length === 0}
              onClick={toggleAll}
            >
              {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {selectableItems.length === 0 && (
              <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                Không có task nào có thể nhắc lịch trong danh sách hiện tại.
              </div>
            )}

            {selectableItems.map((item) => {
              const checked = selectedSet.has(item.id);
              const catColor = categoryColor(item.category);

              return (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-start gap-3 rounded-lg border border-border/50 bg-card/80 p-3 text-left transition hover:bg-accent/40"
                  onClick={() => toggle(item.id)}
                >
                  <span className="mt-0.5 text-primary">
                    {checked ? <CheckSquare className="size-5" /> : <Square className="size-5" />}
                  </span>

                  <span className="min-w-0 flex-1 space-y-2">
                    <span className="block font-medium leading-snug">{item.title}</span>
                    {item.description && (
                      <span className="line-clamp-2 block text-sm text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="border-0 font-normal"
                        style={{ backgroundColor: `${catColor}18`, color: catColor }}
                      >
                        {item.category}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        {STATUS_META[item.status].label}
                      </Badge>
                      <span>
                        {fmt(item.startDate)}
                        {item.endDate ? ` → ${fmt(item.endDate)}` : ''}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={selectedIds.length === 0 || sendReminders.isPending}
            onClick={handleSend}
          >
            {sendReminders.isPending ? 'Đang gửi...' : 'Gửi nhắc lịch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
