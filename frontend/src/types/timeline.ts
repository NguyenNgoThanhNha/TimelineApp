// Kiểu dữ liệu khớp với response của backend NestJS.

export type TimelineStatus =
  | 'Planned'
  | 'InProgress'
  | 'Completed'
  | 'OnHold'
  | 'Cancelled';

export interface Timeline {
  id: string;
  title: string;
  description?: string | null;
  startDate: string; // ISO date string
  endDate?: string | null;
  status: TimelineStatus;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// Payload gửi lên khi tạo/sửa
export interface TimelineRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  status: TimelineStatus;
  category: string;
}

// Bộ lọc phía client (gửi thành query string)
export interface TimelineFilters {
  search?: string;
  status?: TimelineStatus | '';
  category?: string;
  from?: string;
  to?: string;
}
