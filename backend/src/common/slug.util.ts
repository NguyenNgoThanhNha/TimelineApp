// Tiện ích tạo slug từ tiêu đề tiếng Việt: "Ngày 03: IoC & Bean" -> "ngay-03-ioc-bean".

// Dải dấu thanh/dấu mũ (combining marks) sinh ra sau khi normalize('NFD')
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

export function slugify(input: string): string {
  return input
    .replace(/đ/g, 'd') // đ
    .replace(/Đ/g, 'd') // Đ
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Ước lượng thời gian đọc (phút) từ nội dung Markdown.
 * Trung bình 200 từ/phút — đủ dùng cho nhãn "x phút đọc".
 */
export function estimateReadMinutes(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, ' ') // bỏ code block cho khỏi lệch
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
