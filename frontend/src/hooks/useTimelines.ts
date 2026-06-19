import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/timelineApi';
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
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateTimeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TimelineRequest }) => api.updateTimeline(id, body),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteTimeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTimeline(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateTimelineStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ item, status }: { item: Timeline; status: Timeline['status'] }) =>
      api.updateTimeline(item.id, {
        title: item.title,
        description: item.description ?? undefined,
        startDate: item.startDate.slice(0, 10),
        endDate: item.endDate ? item.endDate.slice(0, 10) : null,
        status,
        category: item.category,
      }),
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
      context?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => invalidateAll(qc),
  });
}
