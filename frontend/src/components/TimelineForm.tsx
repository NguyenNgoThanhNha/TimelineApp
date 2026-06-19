import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from './Modal';
import { useCategories, useCreateTimeline, useUpdateTimeline } from '../hooks/useTimelines';
import { STATUS_OPTIONS } from '../lib/constants';
import type { Timeline } from '../types/timeline';

// Validation form bằng Zod (đồng bộ với validation phía backend)
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
  initial: Timeline | null;
  onClose: () => void;
}

export function TimelineForm({ initial, onClose }: Props) {
  const isEdit = !!initial;
  const create = useCreateTimeline();
  const update = useUpdateTimeline();
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    formState: { errors },
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
      onClose();
    } catch {
      // lỗi hiển thị qua apiError bên dưới
    }
  };

  const pending = create.isPending || update.isPending;
  const apiError = (create.error || update.error) as Error | null;

  return (
    <Modal title={isEdit ? 'Sửa timeline' : 'Thêm timeline'} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>Tiêu đề *</span>
          <input className="input" {...register('title')} placeholder="VD: Học NestJS" />
          {errors.title && <em className="err">{errors.title.message}</em>}
        </label>

        <div className="field-row">
          <label className="field">
            <span>Danh mục *</span>
            <input className="input" list="category-list" {...register('category')} placeholder="VD: Tech" />
            <datalist id="category-list">
              {categories?.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {errors.category && <em className="err">{errors.category.message}</em>}
          </label>

          <label className="field">
            <span>Trạng thái *</span>
            <select className="input" {...register('status')}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Ngày bắt đầu *</span>
            <input className="input" type="date" {...register('startDate')} />
            {errors.startDate && <em className="err">{errors.startDate.message}</em>}
          </label>
          <label className="field">
            <span>Ngày kết thúc</span>
            <input className="input" type="date" {...register('endDate')} />
            {errors.endDate && <em className="err">{errors.endDate.message}</em>}
          </label>
        </div>

        <label className="field">
          <span>Mô tả</span>
          <textarea className="input" rows={3} {...register('description')} placeholder="Chi tiết..." />
          {errors.description && <em className="err">{errors.description.message}</em>}
        </label>

        {apiError && <div className="form-error">⚠️ {apiError.message}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
