import { Link } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';
import { usePostSeries } from '@/hooks/useBlog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/** Trang tổng hợp chuỗi bài nhiều kỳ (kiểu "99 Ngày .NET"). */
export function SeriesPage() {
  const { data: series, isLoading } = usePostSeries();

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
          <Link to="/blog">
            <ArrowLeft className="size-4" /> Danh sách bài viết
          </Link>
        </Button>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
          <Layers className="size-5" />
          Chuỗi bài
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {series ? `${series.length} chuỗi` : 'Đang tải…'}
        </p>
      </div>

      {isLoading && (
        <Card className="glass-panel">
          <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            Đang tải chuỗi bài…
          </CardContent>
        </Card>
      )}

      {series && series.length === 0 && (
        <Card className="glass-panel">
          <CardContent className="py-16 text-center text-muted-foreground">
            Chưa có chuỗi bài nào. Khi soạn bài, điền tên chuỗi và số thứ tự để gom các kỳ lại với
            nhau.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {series?.map((item) => (
          <Link key={item.slug} to={`/blog/chuoi/${encodeURIComponent(item.name)}`}>
            <Card className="glass-panel h-full transition-shadow hover:shadow-lg">
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.count} kỳ</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
