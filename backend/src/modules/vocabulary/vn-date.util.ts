// Toàn bộ module từ vựng tính "ngày" theo giờ Việt Nam (giống ZaloReminderService).
// Ngày học / ngày ôn được chuẩn hoá về 00:00 của ngày VN rồi lưu dưới dạng UTC,
// nhờ vậy group theo ngày và tính streak chỉ là so sánh timestamp, không cần aggregate pipeline.

const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const VN_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: VN_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Mốc 00:00 (giờ VN) của ngày chứa `value`. */
export function vnDayStart(value: Date = new Date()): Date {
  // en-CA cho ra đúng định dạng YYYY-MM-DD
  return new Date(`${VN_PARTS.format(value)}T00:00:00.000Z`);
}

/** Cộng/trừ số ngày trên mốc đầu ngày. */
export function addDays(day: Date, days: number): Date {
  return new Date(day.getTime() + days * DAY_MS);
}

/** "2026-08-13" -> mốc đầu ngày; chuỗi không hợp lệ trả về null. */
export function parseDayParam(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return vnDayStart(parsed);
}

/** Khoá so sánh ngày: "2026-08-13". */
export function dayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}
