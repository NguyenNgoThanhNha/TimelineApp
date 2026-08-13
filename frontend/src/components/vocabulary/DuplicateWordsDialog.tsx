import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatVnDate } from '@/lib/vocabulary-format';
import type { DuplicateVocabulary } from '@/types/vocabulary';

interface Props {
  duplicates: DuplicateVocabulary[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkReviewed: (ids: string[]) => void;
  isPending?: boolean;
}

/**
 * Từ đã học rồi thì KHÔNG tạo bản ghi mới — chỉ hỏi có đánh dấu là đã ôn lại hôm nay không.
 */
export function DuplicateWordsDialog({
  duplicates,
  open,
  onOpenChange,
  onMarkReviewed,
  isPending,
}: Props) {
  if (!duplicates.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {duplicates.length === 1 ? 'Từ này đã học rồi' : `${duplicates.length} từ đã học rồi`}
          </DialogTitle>
          <DialogDescription>
            Hệ thống không tạo thêm bản ghi mới. Bạn có muốn đánh dấu là đã ôn lại hôm nay không?
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
          {duplicates.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2"
            >
              <div>
                <Link to={`/tu-vung/${item.id}`} className="font-medium hover:text-primary">
                  {item.word}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Đã học ngày {formatVnDate(item.learnedDate)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Bỏ qua
          </Button>
          <Button
            onClick={() => onMarkReviewed(duplicates.map((item) => item.id))}
            disabled={isPending}
          >
            Đánh dấu đã ôn lại hôm nay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
