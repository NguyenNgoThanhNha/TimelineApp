// Kiểu dữ liệu cho blog kiến thức: bài viết, trang tài liệu nội bộ và link tài nguyên ngoài.

import type { Timeline, TimelineStatus } from './timeline';

export type ResourceType = 'Article' | 'Video' | 'Docs' | 'Repo' | 'Course' | 'Other';

export interface Author {
  id: string;
  name: string;
}

/** Task được gắn vào bài viết (rút gọn) */
export interface TimelineRef {
  id: string;
  title: string;
  status: TimelineStatus;
  category: string;
  startDate?: string;
  endDate?: string | null;
}

/** Tài liệu nội bộ ở dạng rút gọn — dùng cho danh sách trong task / bài viết */
export interface DocRef {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  order: number;
  updatedAt?: string;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  note?: string | null;
  timelineId?: string | null;
  postId?: string | null;
  createdAt: string;
}

/** Bài viết ở dạng card (API danh sách không trả `content` cho nhẹ) */
export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  coverImage?: string | null;
  category: string;
  tags: string[];
  // Chuỗi bài nhiều kỳ, vd "99 Ngày .NET" — kỳ số mấy
  series?: string | null;
  seriesOrder?: number | null;
  published: boolean;
  readMinutes: number;
  views: number;
  publishedAt: string;
  // Có giá trị = bài đang chờ job nền tự đăng khi tới hạn
  scheduledAt?: string | null;
  author?: Author;
  timelines?: TimelineRef[];
  _count?: { docs: number; resources: number };
}

/** Một kỳ trong chuỗi bài */
export interface SeriesItem {
  id: string;
  slug: string;
  title: string;
  seriesOrder?: number | null;
  published: boolean;
}

/** Điều hướng trong chuỗi bài, trả kèm trang chi tiết */
export interface SeriesNav {
  name: string;
  slug: string;
  items: SeriesItem[];
  current: number;
  total: number;
  prev: SeriesItem | null;
  next: SeriesItem | null;
}

/** Bài viết đầy đủ cho trang chi tiết */
export interface Post extends PostSummary {
  content: string;
  docs: DocRef[];
  resources: Resource[];
  related: PostSummary[];
  seriesNav: SeriesNav | null;
}

export interface PostPage {
  items: PostSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PostFilters {
  search?: string;
  category?: string;
  tag?: string;
  series?: string;
  timelineId?: string;
  page?: number;
  pageSize?: number;
}

export interface PostRequest {
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  coverImage?: string;
  category: string;
  tags?: string[];
  series?: string | null;
  seriesOrder?: number | null;
  published?: boolean;
  /** ISO string = hẹn giờ đăng; null = đăng ngay / gỡ lịch */
  scheduledAt?: string | null;
  timelineIds?: string[];
}

export interface CategoryStat {
  name: string;
  slug: string;
  count: number;
}

export interface TagStat {
  name: string;
  count: number;
}

export interface SeriesStat {
  name: string;
  slug: string;
  count: number;
}

/** Thống kê thói quen ghi chép cho Dashboard */
export interface WritingStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalDocs: number;
  postsThisMonth: number;
  writingStreak: number;
  tasksWithoutContent: Array<{ id: string; title: string; category: string; status: string }>;
  tasksWithoutContentTotal: number;
}

/** Kết quả tìm kiếm nhanh (Ctrl+K) */
export interface SearchResult {
  posts: Array<{
    id: string;
    slug: string;
    title: string;
    category: string;
    summary?: string | null;
    series?: string | null;
  }>;
  docs: Array<{ id: string; slug: string; title: string; summary?: string | null }>;
  timelines: Array<{ id: string; title: string; category: string; status: string }>;
}

/** Trang tài liệu nội bộ đầy đủ */
export interface Doc {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  content: string;
  order: number;
  timelineId?: string | null;
  timeline?: TimelineRef | null;
  postId?: string | null;
  post?: { id: string; slug: string; title: string; category: string } | null;
  owner?: Author;
  createdAt: string;
  updatedAt: string;
  siblings?: Array<{ id: string; slug: string; title: string }>;
  prev?: { id: string; slug: string; title: string } | null;
  next?: { id: string; slug: string; title: string } | null;
}

export interface DocRequest {
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  order?: number;
  timelineId?: string | null;
  postId?: string | null;
}

export interface ResourceRequest {
  title: string;
  url: string;
  type?: ResourceType;
  note?: string;
  timelineId?: string | null;
  postId?: string | null;
}

/** Chi tiết task kèm "học gì": blog đã gắn, tài liệu nội bộ, link ngoài */
export interface TimelineDetail extends Timeline {
  objectives?: string[];
  posts: PostSummary[];
  docs: DocRef[];
  resources: Resource[];
}
