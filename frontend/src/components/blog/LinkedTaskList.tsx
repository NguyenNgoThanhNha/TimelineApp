import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { categoryColor, STATUS_META } from '@/lib/constants';
import type { TimelineRef } from '@/types/blog';
import { Badge } from '@/components/ui/badge';

interface Props {
  timelines: TimelineRef[];
  emptyText?: string;
}

/** Các task gắn với bài viết — cầu nối từ blog quay lại Kanban. */
export function LinkedTaskList({ timelines, emptyText }: Props) {
  if (!timelines.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyText ?? 'Bài viết này chưa gắn với task nào.'}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {timelines.map((task) => {
        const statusMeta = STATUS_META[task.status];
        const color = categoryColor(task.category);

        return (
          <li key={task.id}>
            <Link
              to={`/task/${task.id}`}
              className="group flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-3 transition-colors hover:border-primary/40"
            >
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full"
                style={{ backgroundColor: statusMeta.color }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug group-hover:text-primary">{task.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    style={{ borderColor: `${statusMeta.color}55`, color: statusMeta.color }}
                  >
                    {statusMeta.label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-0"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {task.category}
                  </Badge>
                </div>
              </div>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
