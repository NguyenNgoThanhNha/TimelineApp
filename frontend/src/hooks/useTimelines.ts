import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/timelineApi';
import type { TimelineFilters, TimelineRequest } from '../types/timeline';

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

export function useCreateTimeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TimelineRequest) => api.createTimeline(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timelines'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateTimeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TimelineRequest }) => api.updateTimeline(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timelines'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteTimeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTimeline(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timelines'] }),
  });
}
