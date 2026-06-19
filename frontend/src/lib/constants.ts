import type { TimelineStatus } from '../types/timeline';

// Nhãn tiếng Việt + màu cho từng trạng thái (dùng cho badge, dot, viền card)
export const STATUS_META: Record<TimelineStatus, { label: string; color: string }> = {
  Planned: { label: 'Dự kiến', color: '#64748b' },
  InProgress: { label: 'Đang làm', color: '#f59e0b' },
  Completed: { label: 'Hoàn thành', color: '#22c55e' },
  OnHold: { label: 'Tạm dừng', color: '#a855f7' },
  Cancelled: { label: 'Đã huỷ', color: '#ef4444' },
};

export const STATUS_OPTIONS = (Object.keys(STATUS_META) as TimelineStatus[]).map((value) => ({
  value,
  label: STATUS_META[value].label,
}));

// Màu cho category — hash tên category để chọn màu ổn định
const CATEGORY_COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export function categoryColor(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}
