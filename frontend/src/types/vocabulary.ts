// Kiểu dữ liệu khớp với response của module vocabulary (NestJS + Prisma).

export type PartOfSpeech =
  | 'Noun'
  | 'Verb'
  | 'Adjective'
  | 'Adverb'
  | 'Pronoun'
  | 'Preposition'
  | 'Conjunction'
  | 'Interjection'
  | 'PhrasalVerb'
  | 'Idiom'
  | 'Phrase'
  | 'Other';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type LearningStatus = 'New' | 'Learning' | 'Familiar' | 'Mastered';
export type EnrichmentStatus = 'Pending' | 'Completed' | 'Failed';
export type ExampleDifficulty = 'Basic' | 'Intermediate' | 'Advanced';
export type PronunciationAccent = 'UK' | 'US' | 'Other';
export type VocabularyRelationType = 'Synonym' | 'Antonym' | 'WordForm';
export type ReviewResult = 'Again' | 'Hard' | 'Good' | 'Easy';

export interface VocabularyPronunciation {
  id: string;
  accent: PronunciationAccent;
  ipa?: string | null;
  audioUrl?: string | null;
}

export interface VocabularyExample {
  id: string;
  englishSentence: string;
  vietnameseTranslation?: string | null;
  difficultyLevel: ExampleDifficulty;
  order: number;
}

export interface VocabularyMeaning {
  id: string;
  partOfSpeech: PartOfSpeech;
  englishDefinition?: string | null;
  vietnameseMeaning?: string | null;
  order: number;
  examples: VocabularyExample[];
}

export interface VocabularyRelation {
  id: string;
  relatedWord: string;
  relatedWordKey: string;
  relationType: VocabularyRelationType;
  partOfSpeech?: PartOfSpeech | null;
  /** Chỉ có ở API chi tiết: id nếu từ này đã nằm trong bộ từ của mình, null nếu chưa học. */
  relatedVocabularyId?: string | null;
}

export interface Vocabulary {
  id: string;
  word: string;
  wordKey: string;
  cefrLevel?: CefrLevel | null;
  learnedDate: string;
  learningStatus: LearningStatus;
  note?: string | null;
  enrichmentStatus: EnrichmentStatus;
  enrichmentError?: string | null;
  enrichmentSuggestions: string[];
  enrichedAt?: string | null;

  // Spaced repetition
  lastReviewDate?: string | null;
  nextReviewDate?: string | null;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  masteryLevel: number;
  easeFactor: number;
  intervalDays: number;

  createdAt: string;
  updatedAt: string;

  pronunciations: VocabularyPronunciation[];
  meanings: VocabularyMeaning[];
  relations: VocabularyRelation[];
}

// ----- Request / response -----

export interface CreateVocabularyResult {
  isDuplicate: boolean;
  vocabulary: Vocabulary;
}

/** Từ đã tồn tại — frontend hỏi "đánh dấu đã ôn lại hôm nay?" thay vì tạo trùng. */
export interface DuplicateVocabulary {
  id: string;
  word: string;
  learnedDate: string;
}

export interface BulkCreateResult {
  created: Vocabulary[];
  duplicates: DuplicateVocabulary[];
}

export interface DailyVocabulary {
  date: string;
  learnedCount: number;
  reviewedCount: number;
  items: Vocabulary[];
}

export interface VocabularyHistoryEntry {
  date: string;
  learnedCount: number;
  reviewedCount: number;
}

export interface VocabularyStatistics {
  total: number;
  byStatus: Record<LearningStatus, number>;
  /** Phân bố trình độ; khoá 'Unknown' gom các từ chưa xác định được CEFR. */
  byCefr: Record<CefrLevel | 'Unknown', number>;
  today: number;
  reviewedToday: number;
  /** Số từ tới hạn ôn hôm nay — nguồn cho badge và nút vào flashcard. */
  dueToday: number;
  last7Days: number;
  thisMonth: number;
  streak: number;
}

/** Một lượt ôn đã ghi nhận — cho thấy thuật toán giãn cách ra sao. */
export interface VocabularyReviewEntry {
  id: string;
  reviewDate: string;
  reviewDay: string;
  result: ReviewResult;
  nextReviewDate?: string | null;
  intervalDays: number;
}

export interface VocabularyLookupResult {
  word: string;
  exists: boolean;
  vocabulary: { id: string; word: string; learnedDate: string } | null;
}

export type VocabularySortOption = 'recent' | 'oldest' | 'az' | 'za';

export interface VocabularyFilters {
  search?: string;
  partOfSpeech?: PartOfSpeech | '';
  cefrLevel?: CefrLevel | '';
  learningStatus?: LearningStatus | '';
  date?: string;
  sort?: VocabularySortOption;
  page?: number;
  pageSize?: number;
}
