// Backend đã chuẩn hoá ngày học / ngày ôn về 00:00 giờ Việt Nam rồi lưu dưới dạng UTC.
// Vì vậy chỉ cần đọc thẳng phần YYYY-MM-DD của chuỗi ISO — không đổi sang giờ máy người dùng,
// tránh việc máy ở múi giờ âm hiển thị lùi mất một ngày.

/** "2026-08-13T00:00:00.000Z" -> "2026-08-13" */
export function toDateParam(value: Date | string): string {
  const iso = typeof value === 'string' ? value : value.toISOString();
  return iso.slice(0, 10);
}

/** "2026-08-13T00:00:00.000Z" -> "13/08/2026" */
export function formatVnDate(value?: string | null): string {
  if (!value) return '—';
  const [year, month, day] = toDateParam(value).split('-');
  if (!year || !month || !day) return '—';
  return `${day}/${month}/${year}`;
}

/** Ngày hôm nay theo giờ Việt Nam, dạng "2026-08-13". */
export function vnToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
