import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Link2, ListChecks, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useDeletePost, usePost } from '@/hooks/useBlog';
import { categoryColor } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArticleLayout } from '@/components/blog/ArticleLayout';
import { CoverArt } from '@/components/blog/CoverArt';
import { DocList } from '@/components/blog/DocList';
import { LinkedTaskList } from '@/components/blog/LinkedTaskList';
import { PostCard } from '@/components/blog/PostCard';
import { PostMeta } from '@/components/blog/PostMeta';
import { ResourceList } from '@/components/blog/ResourceList';

/** Trang đọc bài viết: nội dung Markdown + mục lục + task liên quan + tài liệu đính kèm. */
export function PostDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: post, isLoading, isError, error } = usePost(slug);
  const deletePost = useDeletePost();

  if (isLoading) {
    return (
      <Card className="glass-panel">
        <CardContent className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
          <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
          Đang tải bài viết…
        </CardContent>
      </Card>
    );
  }

  if (isError || !post) {
    return (
      <Card className="glass-panel border-destructive/30 bg-destructive/5">
        <CardContent className="space-y-3 py-10 text-center">
          <p className="text-destructive">{(error as Error)?.message ?? 'Không tìm thấy bài viết'}</p>
          <Button variant="outline" asChild>
            <Link to="/blog">
              <ArrowLeft className="size-4" /> Về danh sách bài viết
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const color = categoryColor(post.category);
  const canEdit = user?.id === post.author?.id || user?.role === 'Admin';

  const handleDelete = () => {
    if (!window.confirm(`Xoá bài viết "${post.title}"?`)) return;
    deletePost.mutate(post.id, { onSuccess: () => navigate('/blog') });
  };

  return (
    <ArticleLayout
      breadcrumb={
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/blog" className="hover:text-foreground">
            Bài viết
          </Link>
          <span>/</span>
          <Link
            to={`/blog/chuyen-muc/${encodeURIComponent(post.category)}`}
            className="hover:text-foreground"
          >
            {post.category}
          </Link>
        </nav>
      }
      eyebrow={
        <>
          <Link to={`/blog/chuyen-muc/${encodeURIComponent(post.category)}`}>
            <Badge variant="outline" className="border-0" style={{ backgroundColor: `${color}18`, color }}>
              {post.category}
            </Badge>
          </Link>
          {!post.published && (
            <Badge variant="outline" className="border-dashed text-muted-foreground">
              Bản nháp
            </Badge>
          )}
        </>
      }
      title={post.title}
      meta={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PostMeta
            publishedAt={post.publishedAt}
            readMinutes={post.readMinutes}
            views={post.views}
            author={post.author?.name}
          />
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/blog/${post.slug}/sua`}>
                  <Pencil className="size-4" /> Sửa
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="size-4" /> Xoá
              </Button>
            </div>
          )}
        </div>
      }
      summary={post.summary}
      cover={<CoverArt coverImage={post.coverImage} seed={post.slug} />}
      content={post.content}
      sidebar={
        <>
          {!!post.timelines?.length && (
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ListChecks className="size-4" />
                Task liên quan
              </p>
              <LinkedTaskList timelines={post.timelines} />
            </div>
          )}
          {!!post.docs.length && (
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <FileText className="size-4" />
                Tài liệu đính kèm
              </p>
              <ul className="space-y-1.5 text-sm">
                {post.docs.map((doc) => (
                  <li key={doc.id}>
                    <Link to={`/tai-lieu/${doc.slug}`} className="text-muted-foreground hover:text-primary">
                      {doc.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      }
      footer={
        <>
          {!!post.tags.length && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-6">
              {post.tags.map((tag) => (
                <Link key={tag} to={`/blog/the/${encodeURIComponent(tag)}`}>
                  <Badge variant="secondary">#{tag}</Badge>
                </Link>
              ))}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4" />
                  Tài liệu đính kèm ({post.docs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DocList
                  docs={post.docs}
                  emptyText="Bài viết này chưa có trang tài liệu nào. Thêm từ trang chi tiết task."
                />
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="size-4" />
                  Nguồn tham khảo ({post.resources.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceList resources={post.resources} />
              </CardContent>
            </Card>
          </div>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="size-4" />
                Task áp dụng kiến thức này
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LinkedTaskList timelines={post.timelines ?? []} />
            </CardContent>
          </Card>

          {!!post.related.length && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">Bài viết liên quan</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {post.related.map((item) => (
                  <PostCard key={item.id} post={item} compact />
                ))}
              </div>
            </div>
          )}
        </>
      }
    />
  );
}
