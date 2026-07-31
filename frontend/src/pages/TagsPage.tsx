import { Link } from 'react-router-dom';
import { ArrowLeft, Tags } from 'lucide-react';
import { usePostTags } from '@/hooks/useBlog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/** Trang tổng hợp thẻ — cỡ chữ lớn dần theo số bài để thấy chủ đề nào đang học nhiều. */
export function TagsPage() {
  const { data: tags, isLoading } = usePostTags();
  const max = tags?.reduce((acc, t) => Math.max(acc, t.count), 1) ?? 1;

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
          <Link to="/blog">
            <ArrowLeft className="size-4" /> Danh sách bài viết
          </Link>
        </Button>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
          <Tags className="size-5" />
          Thẻ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tags ? `${tags.length} thẻ` : 'Đang tải…'}
        </p>
      </div>

      <Card className="glass-panel">
        <CardContent className="p-6">
          {isLoading && <p className="text-sm text-muted-foreground">Đang tải thẻ…</p>}

          {tags && tags.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có bài viết nào gắn thẻ.</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {tags?.map((tag) => (
              <Link key={tag.name} to={`/blog/the/${encodeURIComponent(tag.name)}`}>
                <Badge
                  variant="secondary"
                  // Thẻ nhiều bài thì hiển thị lớn hơn — nhìn là biết chủ đề trọng tâm
                  style={{ fontSize: `${0.75 + (tag.count / max) * 0.5}rem` }}
                >
                  #{tag.name}
                  <span className="ml-1.5 text-muted-foreground">{tag.count}</span>
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
