import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, ListChecks, PenLine } from 'lucide-react';
import { useCreatePost, usePost, usePostCategories, useUpdatePost } from '@/hooks/useBlog';
import { useTimelines } from '@/hooks/useTimelines';
import { STATUS_META } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownContent } from '@/components/blog/MarkdownContent';

const COVER_OPTIONS = [
  { value: '', label: 'Tự động theo tên bài' },
  { value: 'gradient:violet', label: 'Gradient tím' },
  { value: 'gradient:teal', label: 'Gradient xanh ngọc' },
  { value: 'gradient:amber', label: 'Gradient hổ phách' },
  { value: 'gradient:rose', label: 'Gradient hồng' },
  { value: 'gradient:sky', label: 'Gradient xanh trời' },
  { value: 'gradient:indigo', label: 'Gradient chàm' },
];

const schema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc').max(250),
  category: z.string().min(1, 'Chuyên mục là bắt buộc').max(80),
  summary: z.string().max(500).optional(),
  tags: z.string().optional(),
  coverImage: z.string().optional(),
  published: z.boolean(),
  content: z.string().min(1, 'Nội dung là bắt buộc'),
});

type FormValues = z.infer<typeof schema>;

const TEMPLATE = [
  '## Vấn đề',
  '',
  'Mô tả ngắn thứ mình muốn hiểu.',
  '',
  '## Kiến thức chính',
  '',
  '```csharp',
  '// ví dụ code',
  '```',
  '',
  '## Bài tập nhỏ',
  '',
  '1. …',
  '',
  '## Kết luận',
  '',
  'Tóm lại trong 2-3 câu.',
].join('\n');

/** Trang soạn / sửa bài viết: form bên trái, xem trước Markdown bên phải. */
export function PostEditorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!slug;

  const { data: post, isLoading } = usePost(slug);
  const { data: categories } = usePostCategories();
  const { data: timelines } = useTimelines({});
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      category: '',
      summary: '',
      tags: '',
      coverImage: '',
      published: true,
      content: TEMPLATE,
    },
  });

  // Vào trang sửa: đổ dữ liệu bài viết vào form khi tải xong
  useEffect(() => {
    if (!isEdit || !post) return;
    reset({
      title: post.title,
      category: post.category,
      summary: post.summary ?? '',
      tags: post.tags.join(', '),
      coverImage: post.coverImage ?? '',
      published: post.published,
      content: post.content,
    });
    setSelectedTasks(post.timelines?.map((t) => t.id) ?? []);
  }, [isEdit, post, reset]);

  // Viết bài từ trang task: /blog/moi?taskId=… -> tick sẵn task đó
  useEffect(() => {
    if (isEdit) return;
    const taskId = searchParams.get('taskId');
    if (taskId) setSelectedTasks([taskId]);
  }, [isEdit, searchParams]);

  const preview = watch('content');
  const previewTitle = watch('title');

  const toggleTask = (id: string) => {
    setSelectedTasks((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const sortedTimelines = useMemo(
    () => [...(timelines ?? [])].sort((a, b) => a.title.localeCompare(b.title)),
    [timelines],
  );

  const onSubmit = async (values: FormValues) => {
    const body = {
      title: values.title,
      category: values.category,
      summary: values.summary || undefined,
      tags: values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      coverImage: values.coverImage || undefined,
      published: values.published,
      content: values.content,
      timelineIds: selectedTasks,
    };

    try {
      if (isEdit && post) {
        const updated = await updatePost.mutateAsync({ id: post.id, body });
        navigate(`/blog/${updated.slug}`);
      } else {
        const created = await createPost.mutateAsync(body);
        navigate(`/blog/${created.slug}`);
      }
    } catch {
      // lỗi đã hiển thị qua toast trong hook
    }
  };

  if (isEdit && isLoading) {
    return (
      <Card className="glass-panel">
        <CardContent className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
          <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
          Đang tải bài viết…
        </CardContent>
      </Card>
    );
  }

  const pending = createPost.isPending || updatePost.isPending;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
            <Link to="/blog">
              <ArrowLeft className="size-4" /> Danh sách bài viết
            </Link>
          </Button>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {isEdit ? 'Sửa bài viết' : 'Viết bài mới'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview((v) => !v)}
            aria-pressed={showPreview}
          >
            <Eye className="size-4" />
            {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
          </Button>
          <Button type="submit" form="post-form" disabled={pending}>
            <PenLine className="size-4" />
            {pending ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Đăng bài'}
          </Button>
        </div>
      </div>

      <form
        id="post-form"
        onSubmit={handleSubmit(onSubmit)}
        className={showPreview ? 'grid gap-6 xl:grid-cols-2' : 'grid gap-6'}
      >
        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-base">Thông tin bài viết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input id="title" {...register('title')} placeholder="VD: Ngày 03 — IoC container & Bean" />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Chuyên mục *</Label>
                  <Input
                    id="category"
                    list="post-category-list"
                    {...register('category')}
                    placeholder="VD: Backend"
                  />
                  <datalist id="post-category-list">
                    {categories?.map((c) => (
                      <option key={c.slug} value={c.name} />
                    ))}
                  </datalist>
                  {errors.category && (
                    <p className="text-xs text-destructive">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Thẻ (phân cách bằng dấu phẩy)</Label>
                  <Input id="tags" {...register('tags')} placeholder="spring, spring-core" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Tóm tắt</Label>
                <Input
                  id="summary"
                  {...register('summary')}
                  placeholder="Một đoạn ngắn hiển thị ở card danh sách"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="coverImage">Ảnh bìa</Label>
                  <select
                    id="coverImage"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...register('coverImage')}
                  >
                    {COVER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4" {...register('published')} />
                    Đăng công khai (bỏ tick để lưu nháp)
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="size-4" />
                Gắn với task ({selectedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {sortedTimelines.map((task) => (
                  <label
                    key={task.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md p-2 text-sm hover:bg-accent/50"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{task.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {task.category} · {STATUS_META[task.status].label}
                      </span>
                    </span>
                  </label>
                ))}
                {!sortedTimelines.length && (
                  <p className="text-sm text-muted-foreground">
                    Chưa có task nào. Tạo mốc trên bảng Kanban trước.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-base">Nội dung (Markdown) *</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                rows={24}
                spellCheck={false}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('content')}
              />
              {errors.content && (
                <p className="mt-2 text-xs text-destructive">{errors.content.message}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Hỗ trợ bảng, checklist, trích dẫn và code block có tô màu cú pháp. Heading cấp 2-3 sẽ
                tự vào mục lục của bài.
              </p>
            </CardContent>
          </Card>
        </div>

        {showPreview && (
          <div className="xl:sticky xl:top-20 xl:h-[calc(100vh-7rem)]">
            <Card className="glass-panel h-full overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Xem trước</CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-4rem)] overflow-y-auto">
                {previewTitle && (
                  <h1 className="mb-4 text-2xl font-bold tracking-tight">{previewTitle}</h1>
                )}
                <MarkdownContent content={preview || ''} />
              </CardContent>
            </Card>
          </div>
        )}
      </form>
    </>
  );
}
