import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCategories, useCreateTimeline, useUpdateTimeline } from '@/hooks/useTimelines';
import { STATUS_OPTIONS } from '@/lib/constants';
import type { Timeline } from '@/types/timeline';
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

const schema = z
  .object({
    title: z.string().min(1, 'Tiêu đề là bắt buộc').max(200, 'Tối đa 200 ký tự'),
    description: z.string().max(2000, 'Tối đa 2000 ký tự').optional(),
    startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
    endDate: z.string().optional(),
    status: z.enum(['Planned', 'InProgress', 'Completed', 'OnHold', 'Cancelled']),
    category: z.string().min(1, 'Danh mục là bắt buộc').max(80),
  })
  .refine((d) => !d.endDate || !d.startDate || d.endDate >= d.startDate, {
    path: ['endDate'],
    message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  initial: Timeline | null;
  onClose: () => void;
}

export function TimelineForm({ open, initial, onClose }: Props) {
  const isEdit = !!initial;
  const create = useCreateTimeline();
  const update = useUpdateTimeline();
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          title: initial.title,
          description: initial.description ?? '',
          startDate: initial.startDate.slice(0, 10),
          endDate: initial.endDate ? initial.endDate.slice(0, 10) : '',
          status: initial.status,
          category: initial.category,
        }
      : {
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          status: 'Planned',
          category: '',
        },
  });

  const onSubmit = async (values: FormValues) => {
    const body = {
      title: values.title,
      description: values.description || undefined,
      startDate: values.startDate,
      endDate: values.endDate || null,
      status: values.status,
      category: values.category,
    };
    try {
      if (isEdit && initial) {
        await update.mutateAsync({ id: initial.id, body });
      } else {
        await create.mutateAsync(body);
      }
      reset();
      onClose();
    } catch {
      // lỗi hiển thị qua apiError
    }
  };

  const pending = create.isPending || update.isPending;
  const apiError = (create.error || update.error) as Error | null;

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            title: initial.title,
            description: initial.description ?? '',
            startDate: initial.startDate.slice(0, 10),
            endDate: initial.endDate ? initial.endDate.slice(0, 10) : '',
            status: initial.status,
            category: initial.category,
          }
        : {
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            status: 'Planned',
            category: '',
          },
    );
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa timeline' : 'Thêm timeline'}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input id="title" {...register('title')} placeholder="VD: Học NestJS" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Danh mục *</Label>
              <Input id="category" list="category-list" {...register('category')} placeholder="VD: Tech" />
              <datalist id="category-list">
                {categories?.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái *</Label>
              <select
                id="status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('status')}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Ngày bắt đầu *</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Ngày kết thúc</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <textarea
              id="description"
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('description')}
              placeholder="Chi tiết…"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          {apiError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {apiError.message}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
