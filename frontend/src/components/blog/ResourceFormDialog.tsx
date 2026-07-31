import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateResource } from '@/hooks/useBlog';
import type { ResourceType } from '@/types/blog';
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

const TYPE_OPTIONS: Array<{ value: ResourceType; label: string }> = [
  { value: 'Docs', label: 'Tài liệu chính chủ' },
  { value: 'Article', label: 'Bài viết' },
  { value: 'Video', label: 'Video' },
  { value: 'Course', label: 'Khoá học' },
  { value: 'Repo', label: 'Repository' },
  { value: 'Other', label: 'Khác' },
];

const schema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc').max(250),
  url: z.string().url('Link phải bắt đầu bằng http:// hoặc https://'),
  type: z.enum(['Article', 'Video', 'Docs', 'Repo', 'Course', 'Other']),
  note: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = { title: '', url: '', type: 'Docs', note: '' };

interface Props {
  open: boolean;
  timelineId?: string;
  postId?: string;
  onClose: () => void;
}

/** Form thêm link tài nguyên ngoài cho task hoặc bài viết. */
export function ResourceFormDialog({ open, timelineId, postId, onClose }: Props) {
  const create = useCreateResource();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await create.mutateAsync({
        title: values.title,
        url: values.url,
        type: values.type,
        note: values.note || undefined,
        timelineId: timelineId ?? null,
        postId: postId ?? null,
      });
      onClose();
    } catch {
      // lỗi đã hiển thị qua toast trong hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm tài nguyên ngoài</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="res-title">Tiêu đề *</Label>
            <Input id="res-title" {...register('title')} placeholder="VD: Microsoft Learn — DI" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-url">Link *</Label>
            <Input id="res-url" {...register('url')} placeholder="https://…" />
            {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-type">Loại</Label>
            <select
              id="res-type"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('type')}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-note">Ghi chú</Label>
            <Input id="res-note" {...register('note')} placeholder="Đọc phần nào, vì sao nên đọc" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Đang lưu…' : 'Thêm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
