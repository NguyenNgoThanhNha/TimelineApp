import { Link } from 'react-router-dom';
import { CalendarClock, Send } from 'lucide-react';
import { usePublishPostNow, useScheduledPosts } from '@/hooks/useBlog';
import { formatSchedule } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Hàng đợi bài đã hẹn giờ — job nền sẽ tự đăng khi tới hạn,
 * hoặc bấm "Đăng ngay" để phát hành sớm. Chỉ tác giả (và Admin) thấy khối này.
 */
export function ScheduledQueue() {
  const { data: posts } = useScheduledPosts();
  const publishNow = usePublishPostNow();

  if (!posts?.length) return null;

  return (
    <Card className="glass-panel mb-6 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4" />
          Chờ đăng ({posts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3"
            >
              <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                {formatSchedule(post.scheduledAt)}
              </span>
              <Link
                to={`/blog/${post.slug}`}
                className="min-w-0 flex-1 truncate font-medium hover:text-primary"
              >
                {post.title}
              </Link>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/blog/${post.slug}/sua`}>Sửa lịch</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={publishNow.isPending}
                  onClick={() => publishNow.mutate(post.id)}
                >
                  <Send className="size-4" />
                  Đăng ngay
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
