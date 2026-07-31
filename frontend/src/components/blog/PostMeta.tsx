import { format } from 'date-fns';
import { CalendarDays, Clock, Eye, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  publishedAt: string;
  readMinutes: number;
  views?: number;
  author?: string;
  className?: string;
}

function fmtDate(value: string): string {
  try {
    return format(new Date(value), 'dd/MM/yyyy');
  } catch {
    return '—';
  }
}

/** Dòng thông tin dưới tiêu đề bài viết: tác giả · ngày đăng · thời gian đọc · lượt xem. */
export function PostMeta({ publishedAt, readMinutes, views, author, className }: Props) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground', className)}>
      {author && (
        <span className="inline-flex items-center gap-1.5">
          <User className="size-3.5" />
          {author}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="size-3.5" />
        {fmtDate(publishedAt)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-3.5" />
        {readMinutes} phút đọc
      </span>
      {views !== undefined && (
        <span className="inline-flex items-center gap-1.5">
          <Eye className="size-3.5" />
          {views} lượt xem
        </span>
      )}
    </div>
  );
}
