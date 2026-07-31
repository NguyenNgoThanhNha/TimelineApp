import { Link } from 'react-router-dom';
import { BookOpen, CalendarClock, Flame, FileText, PenLine } from 'lucide-react';
import { useWritingStats } from '@/hooks/useBlog';
import { categoryColor } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Khối "Ghi chép & viết lách" trên Dashboard: đã viết được bao nhiêu,
 * chuỗi ngày viết liên tiếp và những task đang học mà chưa ghi lại gì.
 */
export function WritingStatsPanel() {
  const { data: stats } = useWritingStats();
  if (!stats) return null;

  const tiles = [
    { label: 'Bài đã đăng', value: stats.publishedPosts, icon: BookOpen },
    { label: 'Trang tài liệu', value: stats.totalDocs, icon: FileText },
    { label: 'Bài tháng này', value: stats.postsThisMonth, icon: PenLine },
    { label: 'Chờ đăng', value: stats.scheduledPosts, icon: CalendarClock },
  ];

  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="glass-panel">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Ghi chép &amp; viết lách</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/blog/moi">
              <PenLine className="size-4" /> Viết bài
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-border/60 bg-background/40 p-3">
                <Icon className="mb-2 size-4 text-muted-foreground" />
                <p className="text-xl font-bold tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
            <Flame className="size-5 text-amber-500" />
            <div>
              <p className="font-semibold">
                {stats.writingStreak > 0
                  ? `${stats.writingStreak} ngày viết liên tiếp`
                  : 'Chưa có chuỗi ngày viết nào'}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.writingStreak > 0
                  ? 'Viết thêm một bài hôm nay để giữ chuỗi.'
                  : 'Đăng một bài hôm nay là bắt đầu chuỗi mới.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-base">
            Task chưa ghi lại gì ({stats.tasksWithoutContentTotal})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.tasksWithoutContent.length ? (
            <ul className="space-y-2">
              {stats.tasksWithoutContent.map((task) => {
                const color = categoryColor(task.category);
                return (
                  <li key={task.id}>
                    <Link
                      to={`/task/${task.id}`}
                      className="flex items-start gap-2 rounded-md border border-border/60 bg-background/40 p-2 text-sm transition-colors hover:border-primary/40"
                    >
                      <span className="min-w-0 flex-1 truncate">{task.title}</span>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-0"
                        style={{ backgroundColor: `${color}18`, color }}
                      >
                        {task.category}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Mọi task đang làm đều đã có bài viết hoặc tài liệu. Quá ổn.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
