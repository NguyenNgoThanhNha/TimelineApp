import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  FileText,
  Link2,
  Pencil,
  Plus,
  Target,
} from 'lucide-react';
import {
  useDeleteDoc,
  useDeleteResource,
  useDoc,
  useTimelineDetail,
} from '@/hooks/useBlog';
import { categoryColor, STATUS_META } from '@/lib/constants';
import type { DocRef, Resource } from '@/types/blog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocFormDialog } from '@/components/blog/DocFormDialog';
import { DocList } from '@/components/blog/DocList';
import { PostCard } from '@/components/blog/PostCard';
import { ResourceFormDialog } from '@/components/blog/ResourceFormDialog';
import { ResourceList } from '@/components/blog/ResourceList';

function fmt(value?: string | null): string {
  if (!value) return '—';
  try {
    return format(new Date(value), 'dd/MM/yyyy');
  } catch {
    return '—';
  }
}

/**
 * Trang học tập của một task: mục tiêu "học gì", bài blog đã gắn,
 * trang tài liệu nội bộ và link tài nguyên ngoài.
 */
export function TaskDetailPage() {
  const { id } = useParams();
  const { data: task, isLoading, isError, error } = useTimelineDetail(id);

  const [docFormOpen, setDocFormOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [resourceFormOpen, setResourceFormOpen] = useState(false);

  // Sửa tài liệu cần nội dung đầy đủ nên phải tải riêng theo slug
  const { data: editingDoc } = useDoc(editingSlug ?? undefined);
  const deleteDoc = useDeleteDoc();
  const deleteResource = useDeleteResource();

  if (isLoading) {
    return (
      <Card className="glass-panel">
        <CardContent className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
          <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
          Đang tải task…
        </CardContent>
      </Card>
    );
  }

  if (isError || !task) {
    return (
      <Card className="glass-panel border-destructive/30 bg-destructive/5">
        <CardContent className="space-y-3 py-10 text-center">
          <p className="text-destructive">{(error as Error)?.message ?? 'Không tìm thấy task'}</p>
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="size-4" /> Về bảng Kanban
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusMeta = STATUS_META[task.status];
  const color = categoryColor(task.category);

  const handleDeleteDoc = (doc: DocRef) => {
    if (window.confirm(`Xoá tài liệu "${doc.title}"?`)) deleteDoc.mutate(doc.id);
  };

  const handleDeleteResource = (resource: Resource) => {
    if (window.confirm(`Xoá link "${resource.title}"?`)) deleteResource.mutate(resource.id);
  };

  const openEditDoc = (doc: DocRef) => {
    setEditingSlug(doc.slug);
    setDocFormOpen(true);
  };

  const closeDocForm = () => {
    setDocFormOpen(false);
    setEditingSlug(null);
  };

  return (
    <>
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Kanban
        </Link>
        <span>/</span>
        <span className="text-foreground">{task.category}</span>
      </nav>

      {/* Đầu trang: thông tin task */}
      <Card className="glass-panel mb-6">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
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

          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {task.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {fmt(task.startDate)} → {fmt(task.endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              {task.posts.length} bài viết
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-3.5" />
              {task.docs.length} tài liệu
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Link2 className="size-3.5" />
              {task.resources.length} link
            </span>
          </div>

          {task.description && (
            <p className="border-l-2 border-primary/40 pl-4 text-muted-foreground">
              {task.description}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {/* Học gì trong task này */}
          <Card className="glass-panel">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4" />
                Học xong task này thì nắm được gì
              </CardTitle>
            </CardHeader>
            <CardContent>
              {task.objectives?.length ? (
                <ul className="space-y-2">
                  {task.objectives.map((objective, index) => (
                    <li key={objective} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {index + 1}
                      </span>
                      <span className="text-sm">{objective}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa khai báo mục tiêu học tập. Mở form sửa task trên bảng Kanban để thêm — mỗi
                  dòng là một mục tiêu.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Bài blog tổng hợp kiến thức của task */}
          <Card className="glass-panel">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="size-4" />
                Bài viết tổng hợp kiến thức ({task.posts.length})
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/blog/moi?taskId=${task.id}`}>
                  <Plus className="size-4" />
                  Viết bài cho task này
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {task.posts.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {task.posts.map((post) => (
                    <PostCard key={post.id} post={post} compact />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có bài viết nào gắn với task này.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tài liệu nội bộ */}
          <Card className="glass-panel">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" />
                Tài liệu đính kèm ({task.docs.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingSlug(null);
                  setDocFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Thêm tài liệu
              </Button>
            </CardHeader>
            <CardContent>
              <DocList
                docs={task.docs}
                onEdit={openEditDoc}
                onDelete={handleDeleteDoc}
                emptyText="Chưa có trang tài liệu nào cho task này."
              />
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: tài nguyên ngoài + điều hướng nhanh */}
        <aside className="space-y-6">
          <Card className="glass-panel">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="size-4" />
                Tài nguyên ngoài
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setResourceFormOpen(true)}>
                <Plus className="size-4" />
                Thêm
              </Button>
            </CardHeader>
            <CardContent>
              <ResourceList resources={task.resources} onDelete={handleDeleteResource} />
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-base">Thông tin</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Bắt đầu</dt>
                <dd>{fmt(task.startDate)}</dd>
                <dt className="text-muted-foreground">Kết thúc</dt>
                <dd>{fmt(task.endDate)}</dd>
                <dt className="text-muted-foreground">Cập nhật</dt>
                <dd>{fmt(task.updatedAt)}</dd>
              </dl>
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link to="/">
                  <Pencil className="size-4" />
                  Sửa task trên Kanban
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <DocFormDialog
        open={docFormOpen}
        initial={editingSlug ? editingDoc ?? null : null}
        timelineId={task.id}
        onClose={closeDocForm}
      />

      <ResourceFormDialog
        open={resourceFormOpen}
        timelineId={task.id}
        onClose={() => setResourceFormOpen(false)}
      />
    </>
  );
}
