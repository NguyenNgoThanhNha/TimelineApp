import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, FileText, ListChecks } from 'lucide-react';
import { useDoc } from '@/hooks/useBlog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArticleLayout } from '@/components/blog/ArticleLayout';
import { LinkedTaskList } from '@/components/blog/LinkedTaskList';

/**
 * Trang đọc tài liệu nội bộ — cùng bố cục với bài blog (mục lục, code block),
 * kèm điều hướng trước/sau giữa các tài liệu của cùng một task.
 */
export function DocDetailPage() {
  const { slug } = useParams();
  const { data: doc, isLoading, isError, error } = useDoc(slug);

  if (isLoading) {
    return (
      <Card className="glass-panel">
        <CardContent className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
          <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
          Đang tải tài liệu…
        </CardContent>
      </Card>
    );
  }

  if (isError || !doc) {
    return (
      <Card className="glass-panel border-destructive/30 bg-destructive/5">
        <CardContent className="space-y-3 py-10 text-center">
          <p className="text-destructive">{(error as Error)?.message ?? 'Không tìm thấy tài liệu'}</p>
          <Button variant="outline" asChild>
            <Link to="/blog">
              <ArrowLeft className="size-4" /> Về danh sách bài viết
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ArticleLayout
      breadcrumb={
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {doc.timeline ? (
            <>
              <Link to={`/task/${doc.timeline.id}`} className="hover:text-foreground">
                {doc.timeline.title}
              </Link>
              <span>/</span>
            </>
          ) : (
            <>
              <Link to="/blog" className="hover:text-foreground">
                Bài viết
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">Tài liệu</span>
        </nav>
      }
      eyebrow={
        <Badge variant="outline" className="gap-1.5">
          <FileText className="size-3.5" />
          Tài liệu đính kèm
        </Badge>
      }
      title={doc.title}
      summary={doc.summary}
      content={doc.content}
      sidebar={
        <>
          {doc.timeline && (
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ListChecks className="size-4" />
                Thuộc task
              </p>
              <LinkedTaskList timelines={[doc.timeline]} />
            </div>
          )}

          {doc.post && (
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <BookOpen className="size-4" />
                Bài viết gốc
              </p>
              <Link
                to={`/blog/${doc.post.slug}`}
                className="block rounded-lg border border-border/60 bg-background/40 p-3 text-sm font-medium hover:border-primary/40 hover:text-primary"
              >
                {doc.post.title}
              </Link>
            </div>
          )}

          {!!doc.siblings?.length && doc.siblings.length > 1 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tài liệu cùng task
              </p>
              <ul className="space-y-1.5 text-sm">
                {doc.siblings.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/tai-lieu/${item.slug}`}
                      className={
                        item.id === doc.id
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground hover:text-primary'
                      }
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-6">
          {doc.prev ? (
            <Button variant="outline" asChild>
              <Link to={`/tai-lieu/${doc.prev.slug}`}>
                <ArrowLeft className="size-4" />
                <span className="max-w-[200px] truncate">{doc.prev.title}</span>
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {doc.next && (
            <Button variant="outline" asChild>
              <Link to={`/tai-lieu/${doc.next.slug}`}>
                <span className="max-w-[200px] truncate">{doc.next.title}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      }
    />
  );
}
