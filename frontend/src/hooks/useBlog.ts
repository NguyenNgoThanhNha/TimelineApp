import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '../api/blogApi';
import type { DocRequest, PostFilters, PostRequest, ResourceRequest } from '../types/blog';

// Hooks TanStack Query cho blog / tài liệu — cùng phong cách với useTimelines.

export function usePosts(filters: PostFilters) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: () => api.getPosts(filters),
  });
}

export function usePost(slug: string | undefined) {
  return useQuery({
    queryKey: ['post', slug],
    queryFn: () => api.getPost(slug!),
    enabled: !!slug,
  });
}

/** Hàng đợi bài hẹn giờ — chỉ tác giả (và Admin) thấy */
export function useScheduledPosts() {
  return useQuery({ queryKey: ['posts-scheduled'], queryFn: api.getScheduledPosts });
}

export function usePostCategories() {
  return useQuery({ queryKey: ['post-categories'], queryFn: api.getPostCategories });
}

export function usePostTags() {
  return useQuery({ queryKey: ['post-tags'], queryFn: api.getPostTags });
}

export function usePostSeries() {
  return useQuery({ queryKey: ['post-series'], queryFn: api.getPostSeries });
}

export function useWritingStats() {
  return useQuery({ queryKey: ['writing-stats'], queryFn: api.getWritingStats });
}

/** Tìm kiếm nhanh — chỉ chạy khi gõ từ 2 ký tự trở lên */
export function useSearch(term: string) {
  return useQuery({
    queryKey: ['search', term],
    queryFn: () => api.searchAll(term),
    enabled: term.trim().length >= 2,
  });
}

export function useDoc(slug: string | undefined) {
  return useQuery({
    queryKey: ['doc', slug],
    queryFn: () => api.getDoc(slug!),
    enabled: !!slug,
  });
}

export function useTimelineDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['timeline-detail', id],
    queryFn: () => api.getTimelineDetail(id!),
    enabled: !!id,
  });
}

// Sau mỗi thay đổi: làm mới danh sách bài, chuyên mục, thẻ và chi tiết task
function invalidateBlog(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['posts'] });
  qc.invalidateQueries({ queryKey: ['post'] });
  qc.invalidateQueries({ queryKey: ['posts-scheduled'] });
  qc.invalidateQueries({ queryKey: ['post-categories'] });
  qc.invalidateQueries({ queryKey: ['post-tags'] });
  qc.invalidateQueries({ queryKey: ['post-series'] });
  qc.invalidateQueries({ queryKey: ['writing-stats'] });
  qc.invalidateQueries({ queryKey: ['timeline-detail'] });
}

export function usePublishPostNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.publishPostNow(id),
    onSuccess: (post) => {
      invalidateBlog(qc);
      toast.success(`Đã đăng "${post.title}"`);
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PostRequest) => api.createPost(body),
    onSuccess: () => {
      invalidateBlog(qc);
      toast.success('Đã đăng bài viết');
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<PostRequest> }) =>
      api.updatePost(id, body),
    onSuccess: () => {
      invalidateBlog(qc);
      toast.success('Đã cập nhật bài viết');
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePost(id),
    onSuccess: () => {
      invalidateBlog(qc);
      toast.success('Đã xoá bài viết');
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useCreateDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DocRequest) => api.createDoc(body),
    onSuccess: () => {
      invalidateBlog(qc);
      qc.invalidateQueries({ queryKey: ['doc'] });
      toast.success('Đã thêm tài liệu');
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useUpdateDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<DocRequest> }) =>
      api.updateDoc(id, body),
    onSuccess: () => {
      invalidateBlog(qc);
      qc.invalidateQueries({ queryKey: ['doc'] });
      toast.success('Đã cập nhật tài liệu');
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useDeleteDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDoc(id),
    onSuccess: () => {
      invalidateBlog(qc);
      qc.invalidateQueries({ queryKey: ['doc'] });
      toast.success('Đã xoá tài liệu');
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ResourceRequest) => api.createResource(body),
    onSuccess: () => {
      invalidateBlog(qc);
      toast.success('Đã thêm tài nguyên');
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteResource(id),
    onSuccess: () => {
      invalidateBlog(qc);
      toast.success('Đã xoá tài nguyên');
    },
    onError: (err) => toast.error((err as Error).message),
  });
}
