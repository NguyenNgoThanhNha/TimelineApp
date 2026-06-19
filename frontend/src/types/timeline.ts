// Kiểu dữ liệu khớp với response của backend NestJS.

export type TimelineStatus =
  | 'Planned'
  | 'InProgress'
  | 'Completed'
  | 'OnHold'
  | 'Cancelled';

export type Role = 'User' | 'Admin';

export interface Timeline {
  id: string;
  title: string;
  description?: string | null;
  startDate: string; // ISO date string
  endDate?: string | null;
  status: TimelineStatus;
  category: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

// Payload gửi lên khi tạo/sửa (userId do server tự gán theo người đăng nhập)
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

// ----- Auth -----
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

// ----- Dashboard -----
export interface Stats {
  total: number;
  completed: number;
  upcoming: number;
  overdue: number;
  completionRate: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}
