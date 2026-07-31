import { apiClient } from './client';
import type {
  CategoryStat,
  Doc,
  DocRef,
  DocRequest,
  Post,
  PostFilters,
  PostPage,
  PostRequest,
  PostSummary,
  Resource,
  ResourceRequest,
  SearchResult,
  SeriesStat,
  TagStat,
  TimelineDetail,
  WritingStats,
} from '../types/blog';

// Lớp API client cho blog / tài liệu — response đã được interceptor bóc khỏi envelope.

// ----- Bài viết -----

export async function getPosts(filters: PostFilters): Promise<PostPage> {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.category) params.category = filters.category;
  if (filters.tag) params.tag = filters.tag;
  if (filters.series) params.series = filters.series;
  if (filters.timelineId) params.timelineId = filters.timelineId;
  if (filters.page) params.page = filters.page;
  if (filters.pageSize) params.pageSize = filters.pageSize;

  const { data } = await apiClient.get<PostPage>('/posts', { params });
  return data;
}

export async function getPost(slug: string): Promise<Post> {
  const { data } = await apiClient.get<Post>(`/posts/${slug}`);
  return data;
}

export async function createPost(body: PostRequest): Promise<Post> {
  const { data } = await apiClient.post<Post>('/posts', body);
  return data;
}

export async function updatePost(id: string, body: Partial<PostRequest>): Promise<Post> {
  const { data } = await apiClient.put<Post>(`/posts/${id}`, body);
  return data;
}

export async function deletePost(id: string): Promise<void> {
  await apiClient.delete(`/posts/${id}`);
}

/** Hàng đợi bài đã hẹn giờ, chưa tới hạn đăng */
export async function getScheduledPosts(): Promise<PostSummary[]> {
  const { data } = await apiClient.get<PostSummary[]>('/posts/scheduled');
  return data;
}

/** Đăng ngay một bài đang hẹn giờ / đang nháp */
export async function publishPostNow(id: string): Promise<PostSummary> {
  const { data } = await apiClient.post<PostSummary>(`/posts/${id}/publish`);
  return data;
}

export async function getPostCategories(): Promise<CategoryStat[]> {
  const { data } = await apiClient.get<CategoryStat[]>('/posts/categories');
  return data;
}

export async function getPostTags(): Promise<TagStat[]> {
  const { data } = await apiClient.get<TagStat[]>('/posts/tags');
  return data;
}

export async function getPostSeries(): Promise<SeriesStat[]> {
  const { data } = await apiClient.get<SeriesStat[]>('/posts/series');
  return data;
}

export async function getWritingStats(): Promise<WritingStats> {
  const { data } = await apiClient.get<WritingStats>('/posts/stats');
  return data;
}

/** Tìm nhanh trong bài viết, tài liệu và task (hộp Ctrl+K) */
export async function searchAll(q: string): Promise<SearchResult> {
  const { data } = await apiClient.get<SearchResult>('/search', { params: { q } });
  return data;
}

// ----- Tài liệu nội bộ -----

export async function getDocs(params: {
  timelineId?: string;
  postId?: string;
  search?: string;
}): Promise<DocRef[]> {
  const { data } = await apiClient.get<DocRef[]>('/docs', { params });
  return data;
}

export async function getDoc(slug: string): Promise<Doc> {
  const { data } = await apiClient.get<Doc>(`/docs/${slug}`);
  return data;
}

export async function createDoc(body: DocRequest): Promise<Doc> {
  const { data } = await apiClient.post<Doc>('/docs', body);
  return data;
}

export async function updateDoc(id: string, body: Partial<DocRequest>): Promise<Doc> {
  const { data } = await apiClient.put<Doc>(`/docs/${id}`, body);
  return data;
}

export async function deleteDoc(id: string): Promise<void> {
  await apiClient.delete(`/docs/${id}`);
}

// ----- Link tài nguyên ngoài -----

export async function getResources(params: {
  timelineId?: string;
  postId?: string;
}): Promise<Resource[]> {
  const { data } = await apiClient.get<Resource[]>('/resources', { params });
  return data;
}

export async function createResource(body: ResourceRequest): Promise<Resource> {
  const { data } = await apiClient.post<Resource>('/resources', body);
  return data;
}

export async function deleteResource(id: string): Promise<void> {
  await apiClient.delete(`/resources/${id}`);
}

// ----- Task kèm phần "học gì" -----

export async function getTimelineDetail(id: string): Promise<TimelineDetail> {
  const { data } = await apiClient.get<TimelineDetail>(`/timelines/${id}`);
  return data;
}
