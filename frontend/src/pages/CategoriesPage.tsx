import { Link } from 'react-router-dom';
import { ArrowLeft, FolderTree } from 'lucide-react';
import { usePostCategories } from '@/hooks/useBlog';
import { categoryColor } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/** Trang tổng hợp chuyên mục — mỗi thẻ dẫn sang danh sách bài của chuyên mục đó. */
export function CategoriesPage() {
  const { data: categories, isLoading } = usePostCategories();

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
          <Link to="/blog">
            <ArrowLeft className="size-4" /> Danh sách bài viết
          </Link>
        </Button>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
          <FolderTree className="size-5" />
          Chuyên mục
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {categories ? `${categories.length} chuyên mục` : 'Đang tải…'}
        </p>
      </div>

      {isLoading && (
        <Card className="glass-panel">
          <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            Đang tải chuyên mục…
          </CardContent>
        </Card>
      )}

      {categories && categories.length === 0 && (
        <Card className="glass-panel">
          <CardContent className="py-16 text-center text-muted-foreground">
            Chưa có bài viết nào nên chưa có chuyên mục.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories?.map((category) => {
          const color = categoryColor(category.name);
          return (
            <Link key={category.slug} to={`/blog/chuyen-muc/${encodeURIComponent(category.name)}`}>
              <Card className="glass-panel h-full transition-shadow hover:shadow-lg">
                <CardContent className="flex items-center gap-4 p-5">
                  <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                    style={{ backgroundColor: `${color}1f`, color }}
                  >
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.count} bài viết</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
