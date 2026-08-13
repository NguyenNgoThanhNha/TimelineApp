import type {
  CefrLevel,
  ExampleDifficulty,
  LearningStatus,
  PartOfSpeech,
  ReviewResult,
} from '../types/vocabulary';

// Nhãn tiếng Việt + màu cho từng trạng thái học (badge, dot, viền card)
export const LEARNING_STATUS_META: Record<LearningStatus, { label: string; color: string }> = {
  New: { label: 'Mới học', color: '#64748b' },
  Learning: { label: 'Đang học', color: '#f59e0b' },
  Familiar: { label: 'Khá nhớ', color: '#0ea5e9' },
  Mastered: { label: 'Đã thuộc', color: '#22c55e' },
};

export const LEARNING_STATUS_OPTIONS = (
  Object.keys(LEARNING_STATUS_META) as LearningStatus[]
).map((value) => ({ value, label: LEARNING_STATUS_META[value].label }));

export const PART_OF_SPEECH_LABEL: Record<PartOfSpeech, string> = {
  Noun: 'Danh từ',
  Verb: 'Động từ',
  Adjective: 'Tính từ',
  Adverb: 'Trạng từ',
  Pronoun: 'Đại từ',
  Preposition: 'Giới từ',
  Conjunction: 'Liên từ',
  Interjection: 'Thán từ',
  PhrasalVerb: 'Cụm động từ',
  Idiom: 'Thành ngữ',
  Phrase: 'Cụm từ',
  Other: 'Khác',
};

/** Nhãn tiếng Anh hiển thị trên badge loại từ (gọn, quen mắt với người học). */
export const PART_OF_SPEECH_SHORT: Record<PartOfSpeech, string> = {
  Noun: 'Noun',
  Verb: 'Verb',
  Adjective: 'Adjective',
  Adverb: 'Adverb',
  Pronoun: 'Pronoun',
  Preposition: 'Preposition',
  Conjunction: 'Conjunction',
  Interjection: 'Interjection',
  PhrasalVerb: 'Phrasal Verb',
  Idiom: 'Idiom',
  Phrase: 'Phrase',
  Other: 'Other',
};

export const PART_OF_SPEECH_OPTIONS = (
  Object.keys(PART_OF_SPEECH_LABEL) as PartOfSpeech[]
).map((value) => ({ value, label: `${PART_OF_SPEECH_SHORT[value]} — ${PART_OF_SPEECH_LABEL[value]}` }));

export const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CEFR_COLOR: Record<CefrLevel, string> = {
  A1: '#22c55e',
  A2: '#84cc16',
  B1: '#eab308',
  B2: '#f97316',
  C1: '#ef4444',
  C2: '#a855f7',
};

export const DIFFICULTY_META: Record<ExampleDifficulty, { label: string; order: number }> = {
  Basic: { label: 'Cơ bản', order: 0 },
  Intermediate: { label: 'Trung cấp', order: 1 },
  Advanced: { label: 'Nâng cao', order: 2 },
};

/** 4 nút tự đánh giá của flashcard — đầu vào cho thuật toán spaced repetition. */
export const REVIEW_RESULT_META: Record<ReviewResult, { label: string; color: string }> = {
  Again: { label: 'Quên rồi', color: '#ef4444' },
  Hard: { label: 'Khó', color: '#f97316' },
  Good: { label: 'Nhớ được', color: '#0ea5e9' },
  Easy: { label: 'Dễ', color: '#22c55e' },
};

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Mới học gần nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
] as const;
