import { apiClient } from './client';
import type {
  BulkCreateResult,
  CreateVocabularyResult,
  DailyVocabulary,
  ReviewResult,
  Vocabulary,
  VocabularyFilters,
  VocabularyHistoryEntry,
  VocabularyLookupResult,
  VocabularyReviewEntry,
  VocabularyStatistics,
} from '../types/vocabulary';

// Lớp API client cho module từ vựng.
// (response.data đã được interceptor bóc khỏi envelope -> chính là Data)

export interface VocabularyPage {
  items: Vocabulary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getVocabularies(filters: VocabularyFilters): Promise<VocabularyPage> {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.partOfSpeech) params.partOfSpeech = filters.partOfSpeech;
  if (filters.cefrLevel) params.cefrLevel = filters.cefrLevel;
  if (filters.learningStatus) params.learningStatus = filters.learningStatus;
  if (filters.date) params.date = filters.date;
  if (filters.sort) params.sort = filters.sort;
  if (filters.page) params.page = filters.page;
  if (filters.pageSize) params.pageSize = filters.pageSize;

  const { data } = await apiClient.get<VocabularyPage>('/vocabulary', { params });
  return data;
}

export async function getVocabulary(id: string): Promise<Vocabulary> {
  const { data } = await apiClient.get<Vocabulary>(`/vocabulary/${id}`);
  return data;
}

export async function createVocabulary(body: {
  word: string;
  note?: string;
}): Promise<CreateVocabularyResult> {
  const { data } = await apiClient.post<CreateVocabularyResult>('/vocabulary', body);
  return data;
}

export async function bulkCreateVocabulary(words: string[]): Promise<BulkCreateResult> {
  const { data } = await apiClient.post<BulkCreateResult>('/vocabulary/bulk', { words });
  return data;
}

export async function getDailyVocabulary(date?: string): Promise<DailyVocabulary> {
  const { data } = await apiClient.get<DailyVocabulary>('/vocabulary/daily', {
    params: date ? { date } : undefined,
  });
  return data;
}

export async function getVocabularyHistory(): Promise<VocabularyHistoryEntry[]> {
  const { data } = await apiClient.get<VocabularyHistoryEntry[]>('/vocabulary/history');
  return data;
}

export async function getVocabularyStatistics(): Promise<VocabularyStatistics> {
  const { data } = await apiClient.get<VocabularyStatistics>('/vocabulary/statistics');
  return data;
}

export async function lookupVocabulary(word: string): Promise<VocabularyLookupResult> {
  const { data } = await apiClient.get<VocabularyLookupResult>('/vocabulary/lookup', {
    params: { word },
  });
  return data;
}

export async function updateVocabulary(
  id: string,
  body: { note?: string; learningStatus?: Vocabulary['learningStatus']; cefrLevel?: Vocabulary['cefrLevel'] },
): Promise<Vocabulary> {
  const { data } = await apiClient.patch<Vocabulary>(`/vocabulary/${id}`, body);
  return data;
}

export async function deleteVocabulary(id: string): Promise<void> {
  await apiClient.delete(`/vocabulary/${id}`);
}

/** Chỉ chỗ này mới gọi lại dictionary/AI — bình thường luôn đọc từ database. */
export async function refreshVocabulary(id: string): Promise<Vocabulary> {
  const { data } = await apiClient.post<Vocabulary>(`/vocabulary/${id}/refresh`);
  return data;
}

export async function reviewVocabulary(id: string, result: ReviewResult): Promise<Vocabulary> {
  const { data } = await apiClient.post<Vocabulary>(`/vocabulary/${id}/review`, { result });
  return data;
}

export async function markVocabularyReviewed(id: string): Promise<Vocabulary> {
  const { data } = await apiClient.post<Vocabulary>(`/vocabulary/${id}/mark-reviewed`);
  return data;
}

export async function getReviewQueue(): Promise<Vocabulary[]> {
  const { data } = await apiClient.get<Vocabulary[]>('/vocabulary/review/today');
  return data;
}

export async function getVocabularyReviews(id: string): Promise<VocabularyReviewEntry[]> {
  const { data } = await apiClient.get<VocabularyReviewEntry[]>(`/vocabulary/${id}/reviews`);
  return data;
}
