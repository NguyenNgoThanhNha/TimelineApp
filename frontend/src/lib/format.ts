import { format } from 'date-fns';

/** Hiển thị thời điểm hẹn đăng: "05/08 08:00" (đủ ngày giờ, đủ ngắn cho badge). */
export function formatSchedule(value?: string | null): string {
  if (!value) return '—';
  try {
    return format(new Date(value), 'dd/MM HH:mm');
  } catch {
    return '—';
  }
}
