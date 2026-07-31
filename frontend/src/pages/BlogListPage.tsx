import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FolderTree, PenLine, Search, Tags } from 'lucide-react';
import { usePostCategories, usePosts, usePostTags } from '@/hooks/useBlog';
import { categoryColor } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { HeroBanner } from '@/components/HeroBanner';
import { PostCard } from '@/components/blog/PostCard';

const PAGE_SIZE = 9;

/**
 * Danh sách bài viết — dùng chung cho 3 route:
 *  /blog, /blog/chuyen-muc/:category, /blog/the/:tag
 */
export function BlogListPage() {
  const { category, tag } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') ?? 1);
  const search = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(search);

  // Đổi route (chuyên mục / thẻ) thì ô tìm kiếm phải khớp lại với URL
  useEffect(() => setSearchInput(search), [search]);

  const { data, isLoading, isError, error } = usePosts({
    search: search || undefined,
    category: category ? decodeURIComponent(category) : undefined,
    tag: tag ? decodeURIComponent(tag) : undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: categories } = usePostCategories();
  const { data: tags } = usePostTags();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set('q', searchInput.trim());
    else next.delete('q');
    next.delete('page');
    setSearchParams(next);
  };

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(next));
    setSearchParams(params);
  };

  const heading = category
    ? `Chuyên mục: ${decodeURIComponent(category)}`
    : tag
      ? `Thẻ: #${decodeURIComponent(tag)}`
      : 'Bài viết';

  return (
    <>
      {!category && !tag && <HeroBanner view="blog" />}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{heading}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} bài viết` : 'Đang đếm…'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={submitSearch} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm bài viết…"
              className="w-56 pl-9"
              aria-label="Tìm bài viết"
            />
          </form>
          <Button variant="outline" asChild>
            <Link to="/blog/chuyen-muc">
              <FolderTree className="size-4" />
              <span className="hidden sm:inline">Chuyên mục</span>
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/blog/the">
              <Tags className="size-4" />
              <span className="hidden sm:inline">Thẻ</span>
            </Link>
          </Button>
          <Button asChild>
            <Link to="/blog/moi">
              <PenLine className="size-4" />
              Viết bài
            </Link>
          </Button>
        </div>
      </div>

      {/* Thanh chuyên mục nhanh */}
      {!!categories?.length && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link to="/blog">
            <Badge variant={category ? 'outline' : 'default'}>Tất cả</Badge>
          </Link>
          {categories.map((c) => {
            const color = categoryColor(c.name);
            const active = category && decodeURIComponent(category) === c.name;
            return (
              <Link key={c.slug} to={`/blog/chuyen-muc/${encodeURIComponent(c.name)}`}>
                <Badge
                  variant="outline"
                  className={active ? 'border-0 ring-2 ring-primary/40' : 'border-0'}
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {c.name} · {c.count}
                </Badge>
              </Link>
            );
          })}
        </div>
      )}

      {isLoading && (
        <Card className="glass-panel">
          <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            Đang tải bài viết…
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="glass-panel border-destructive/30 bg-destructive/5">
          <CardContent className="py-8 text-center text-destructive">
            {(error as Error)?.message ?? 'Lỗi không xác định'}
          </CardContent>
        </Card>
      )}

      {data && data.items.length === 0 && (
        <Card className="glass-panel">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Search className="size-10 text-muted-foreground/50" />
            <p className="font-medium">Chưa có bài viết nào khớp</p>
            <p className="text-sm text-muted-foreground">
              Thử đổi từ khoá, hoặc viết bài đầu tiên cho chủ đề này.
            </p>
            <Button className="mt-2" variant="outline" asChild>
              <Link to="/blog/moi">
                <PenLine className="size-4" /> Viết bài mới
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {data && data.items.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            aria-label="Trang trước"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              variant={n === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => goToPage(n)}
            >
              {n}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            disabled={page >= data.totalPages}
            onClick={() => goToPage(page + 1)}
            aria-label="Trang sau"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Thẻ phổ biến — lối tắt sang trang lọc theo thẻ */}
      {!!tags?.length && (
        <div className="mt-10 border-t border-border/40 pt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Thẻ phổ biến
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 20).map((t) => (
              <Link key={t.name} to={`/blog/the/${encodeURIComponent(t.name)}`}>
                <Badge variant="secondary">
                  #{t.name} · {t.count}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
