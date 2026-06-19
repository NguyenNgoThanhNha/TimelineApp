import { apiClient } from './client';
import type { Timeline, TimelineFilters, TimelineRequest } from '../types/timeline';

// Lớp API client: tách hoàn toàn việc gọi HTTP khỏi component.
// (response.data đã được interceptor bóc khỏi envelope -> chính là Data)

export async function getTimelines(filters: TimelineFilters): Promise<Timeline[]> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.category) params.category = filters.category;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;

  const { data } = await apiClient.get<Timeline[]>('/timelines', { params });
  return data;
}

export async function getTimeline(id: string): Promise<Timeline> {
  const { data } = await apiClient.get<Timeline>(`/timelines/${id}`);
  return data;
}

export async function createTimeline(body: TimelineRequest): Promise<Timeline> {
  const { data } = await apiClient.post<Timeline>('/timelines', body);
  return data;
}

export async function updateTimeline(id: string, body: TimelineRequest): Promise<Timeline> {
  const { data } = await apiClient.put<Timeline>(`/timelines/${id}`, body);
  return data;
}

export async function deleteTimeline(id: string): Promise<void> {
  await apiClient.delete(`/timelines/${id}`);
}

export async function getCategories(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>('/timelines/categories');
  return data;
}
