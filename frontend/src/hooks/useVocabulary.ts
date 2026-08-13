import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '../api/vocabularyApi';
import type { ReviewResult, Vocabulary, VocabularyFilters } from '../types/vocabulary';

// Custom hooks bọc TanStack Query — cùng pattern với useTimelines / useBlog.

/** Enrich chạy nền: còn từ nào Pending thì tự poll lại cho tới khi có dữ liệu. */
const POLL_INTERVAL_MS = 3000;

function hasPending(items?: Vocabulary[]): boolean {
  return !!items?.some((item) => item.enrichmentStatus === 'Pending');
}

export function useVocabularies(filters: VocabularyFilters) {
  return useQuery({
    queryKey: ['vocabulary', 'list', filters],
    queryFn: () => api.getVocabularies(filters),
    refetchInterval: (query) => (hasPending(query.state.data?.items) ? POLL_INTERVAL_MS : false),
  });
}

export function useDailyVocabulary(date?: string) {
  return useQuery({
    queryKey: ['vocabulary', 'daily', date ?? 'today'],
    queryFn: () => api.getDailyVocabulary(date),
    refetchInterval: (query) => (hasPending(query.state.data?.items) ? POLL_INTERVAL_MS : false),
  });
}

export function useVocabulary(id?: string) {
  return useQuery({
    queryKey: ['vocabulary', 'detail', id],
    queryFn: () => api.getVocabulary(id!),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.enrichmentStatus === 'Pending' ? POLL_INTERVAL_MS : false,
  });
}

export function useVocabularyStatistics() {
  return useQuery({
    queryKey: ['vocabulary', 'statistics'],
    queryFn: api.getVocabularyStatistics,
  });
}

export function useVocabularyHistory() {
  return useQuery({
    queryKey: ['vocabulary', 'history'],
    queryFn: api.getVocabularyHistory,
  });
}

export function useReviewQueue() {
  return useQuery({
    queryKey: ['vocabulary', 'review-queue'],
    queryFn: api.getReviewQueue,
    // Hàng đợi được chốt khi bắt đầu phiên ôn — không tự đổi giữa chừng dưới tay người dùng
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useVocabularyReviews(id?: string) {
  return useQuery({
    queryKey: ['vocabulary', 'reviews', id],
    queryFn: () => api.getVocabularyReviews(id!),
    enabled: !!id,
  });
}

/** Sau mỗi thay đổi -> làm mới mọi màn hình từ vựng (danh sách, hôm nay, thống kê…). */
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['vocabulary'] });
}

export function useAddVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { word: string; note?: string }) => api.createVocabulary(body),
    onSuccess: (result) => {
      invalidateAll(qc);
      if (!result.isDuplicate) toast.success(`Đã thêm ${result.vocabulary.word}`);
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useBulkAddVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (words: string[]) => api.bulkCreateVocabulary(words),
    onSuccess: (result) => {
      invalidateAll(qc);
      if (result.created.length) toast.success(`Đã thêm ${result.created.length} từ`);
      // Từ trùng không báo lỗi ở đây — màn hình sẽ hỏi "đánh dấu đã ôn lại hôm nay?"
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useUpdateVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.updateVocabulary>[1];
    }) => api.updateVocabulary(id, body),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Đã cập nhật');
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useDeleteVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteVocabulary(id),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Đã xoá từ');
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useRefreshVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.refreshVocabulary(id),
    onSuccess: (data) => {
      invalidateAll(qc);
      if (data.enrichmentStatus === 'Failed') {
        toast.error(data.enrichmentError ?? 'Không lấy được dữ liệu từ điển');
      } else {
        toast.success('Đã cập nhật dữ liệu từ điển');
      }
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useMarkReviewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.markVocabularyReviewed(id),
    onSuccess: (data) => {
      invalidateAll(qc);
      toast.success(`Đã đánh dấu ôn lại ${data.word}`);
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useReviewVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, result }: { id: string; result: ReviewResult }) =>
      api.reviewVocabulary(id, result),
    onSuccess: () => {
      // Làm mới mọi thứ TRỪ hàng đợi đang ôn dở — nếu không, danh sách thẻ
      // sẽ bị xếp lại ngay dưới tay người dùng sau mỗi lần chấm điểm.
      qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'vocabulary' && query.queryKey[1] !== 'review-queue',
      });
    },
    onError: (err) => toast.error((err as Error).message),
  });
}
