import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '../api/timelineApi';
import { STATUS_META } from '../lib/constants';
import type { TimelineFilters, TimelineRequest, Timeline } from '../types/timeline';

// Custom hooks bọc TanStack Query — tự lo caching, loading, error, refetch.

export function useTimelines(filters: TimelineFilters) {
  return useQuery({
    queryKey: ['timelines', filters],
    queryFn: () => api.getTimelines(filters),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
  });
}

// Sau mỗi thay đổi -> làm mới danh sách, category và thống kê Dashboard
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['timelines'] });
  qc.invalidateQueries({ queryKey: ['categories'] });
  qc.invalidateQueries({ queryKey: ['stats'] });
}

export function useCreateTimeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TimelineRequest) => api.createTimeline(body),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Đã thêm mốc mới');
    },
    // Lỗi tạo/sửa đã hiển thị inline trong form nên không cần toast ở đây
  });
}

export function useUpdateTimeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TimelineRequest }) => api.updateTimeline(id, body),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Đã cập nhật mốc');
    },
  });
}

export function useDeleteTimeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTimeline(id),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Đã xoá mốc');
    },
    onError: (err) => toast.error((err as Error).message),
  });
}

export function useUpdateTimelineStatus() {
  const qc = useQueryClient();
  return useMutation({
    // Gọi API riêng PATCH /timelines/:id/status (gọn, đúng nghĩa)
    mutationFn: ({ item, status }: { item: Timeline; status: Timeline['status'] }) =>
      api.updateTimelineStatus(item.id, status),

    // Optimistic update: cập nhật UI ngay, không chờ server
    onMutate: async ({ item, status }) => {
      await qc.cancelQueries({ queryKey: ['timelines'] });
      const snapshots = qc.getQueriesData<Timeline[]>({ queryKey: ['timelines'] });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData(
          key,
          data.map((t) => (t.id === item.id ? { ...t, status } : t)),
        );
      });
      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      // Rollback nếu lỗi
      context?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error('Không cập nhật được trạng thái');
    },
    onSuccess: (_data, { status }) => {
      toast.success(`Đã chuyển sang "${STATUS_META[status].label}"`);
    },
    onSettled: () => invalidateAll(qc),
  });
}
