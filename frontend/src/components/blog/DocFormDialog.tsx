import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDoc, useUpdateDoc } from '@/hooks/useBlog';
import type { Doc } from '@/types/blog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MarkdownContent } from '@/components/blog/MarkdownContent';

const schema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc').max(250),
  summary: z.string().max(500).optional(),
  content: z.string().min(1, 'Nội dung là bắt buộc'),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = { title: '', summary: '', content: '' };

interface Props {
  open: boolean;
  /** Tài liệu đang sửa; null = tạo mới */
  initial: Doc | null;
  /** Task và/hoặc bài viết mà tài liệu này gắn vào */
  timelineId?: string;
  postId?: string;
  onClose: () => void;
}

/** Form thêm/sửa trang tài liệu nội bộ, có xem trước Markdown ngay bên cạnh. */
export function DocFormDialog({ open, initial, timelineId, postId, onClose }: Props) {
  const isEdit = !!initial;
  const create = useCreateDoc();
  const update = useUpdateDoc();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            title: initial.title,
            summary: initial.summary ?? '',
            content: initial.content,
          }
        : EMPTY,
    );
  }, [open, initial, reset]);

  const preview = watch('content');

  const onSubmit = async (values: FormValues) => {
    const body = {
      title: values.title,
      summary: values.summary || undefined,
      content: values.content,
      ...(isEdit ? {} : { timelineId: timelineId ?? null, postId: postId ?? null }),
    };
    try {
      if (isEdit && initial) await update.mutateAsync({ id: initial.id, body });
      else await create.mutateAsync(body);
      onClose();
    } catch {
      // lỗi đã hiển thị qua toast trong hook
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa tài liệu' : 'Thêm trang tài liệu'}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="doc-title">Tiêu đề *</Label>
            <Input
              id="doc-title"
              {...register('title')}
              placeholder="VD: Cheatsheet vòng đời service"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-summary">Tóm tắt</Label>
            <Input
              id="doc-summary"
              {...register('summary')}
              placeholder="Một câu mô tả tài liệu này dùng để làm gì"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="doc-content">Nội dung (Markdown) *</Label>
              <textarea
                id="doc-content"
                rows={18}
                spellCheck={false}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('content')}
                placeholder={'## Tiêu đề\n\nNội dung…\n\n```csharp\nvar x = 1;\n```'}
              />
              {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Xem trước</Label>
              <div className="max-h-[28rem] overflow-y-auto rounded-md border border-border/60 bg-background/40 p-4">
                {preview ? (
                  <MarkdownContent content={preview} />
                ) : (
                  <p className="text-sm text-muted-foreground">Gõ nội dung để xem trước.</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Đang lưu…' : 'Lưu tài liệu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
