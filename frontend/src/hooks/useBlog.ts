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

export function usePostCategories() {
  return useQuery({ queryKey: ['post-categories'], queryFn: api.getPostCategories });
}

export function usePostTags() {
  return useQuery({ queryKey: ['post-tags'], queryFn: api.getPostTags });
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
  qc.invalidateQueries({ queryKey: ['post-categories'] });
  qc.invalidateQueries({ queryKey: ['post-tags'] });
  qc.invalidateQueries({ queryKey: ['timeline-detail'] });
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
