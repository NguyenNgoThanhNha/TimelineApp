import { Link } from 'react-router-dom';
import { CalendarClock, FileText, Layers, Link2, ListChecks } from 'lucide-react';
import { formatSchedule } from '@/lib/format';
import { categoryColor } from '@/lib/constants';
import type { PostSummary } from '@/types/blog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CoverArt } from '@/components/blog/CoverArt';
import { PostMeta } from '@/components/blog/PostMeta';

interface Props {
  post: PostSummary;
  compact?: boolean;
}

/** Card bài viết dùng ở danh sách blog, trang chuyên mục/thẻ và mục "Bài liên quan". */
export function PostCard({ post, compact }: Props) {
  const color = categoryColor(post.category);
  const taskCount = post.timelines?.length ?? 0;
  const docCount = post._count?.docs ?? 0;
  const resourceCount = post._count?.resources ?? 0;

  return (
    <Card className="glass-panel group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-xl">
      <Link to={`/blog/${post.slug}`} className="block">
        <div className={compact ? 'h-28' : 'h-40'}>
          <CoverArt coverImage={post.coverImage} seed={post.slug} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/blog/chuyen-muc/${encodeURIComponent(post.category)}`}>
            <Badge
              variant="outline"
              className="border-0"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {post.category}
            </Badge>
          </Link>
          {post.series && (
            <Link to={`/blog/chuoi/${encodeURIComponent(post.series)}`}>
              <Badge variant="secondary" className="gap-1">
                <Layers className="size-3" />
                {post.series}
                {post.seriesOrder ? ` · kỳ ${post.seriesOrder}` : ''}
              </Badge>
            </Link>
          )}
          {!post.published &&
            (post.scheduledAt ? (
              <Badge variant="outline" className="gap-1 border-dashed text-muted-foreground">
                <CalendarClock className="size-3" />
                Hẹn {formatSchedule(post.scheduledAt)}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-dashed text-muted-foreground">
                Bản nháp
              </Badge>
            ))}
        </div>

        <Link to={`/blog/${post.slug}`} className="block">
          <h3 className="line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-primary">
            {post.title}
          </h3>
        </Link>

        {!compact && post.summary && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{post.summary}</p>
        )}

        <div className="mt-auto space-y-2 pt-1">
          {(taskCount > 0 || docCount > 0 || resourceCount > 0) && (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {taskCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <ListChecks className="size-3.5" />
                  {taskCount} task
                </span>
              )}
              {docCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <FileText className="size-3.5" />
                  {docCount} tài liệu
                </span>
              )}
              {resourceCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Link2 className="size-3.5" />
                  {resourceCount} link
                </span>
              )}
            </div>
          )}
          <PostMeta
            publishedAt={post.publishedAt}
            readMinutes={post.readMinutes}
            className="text-xs"
          />
        </div>
      </div>
    </Card>
  );
}
