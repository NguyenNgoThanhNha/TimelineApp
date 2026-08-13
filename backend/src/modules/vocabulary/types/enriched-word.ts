import type {
  CefrLevel,
  ExampleDifficulty,
  PartOfSpeech,
  PronunciationAccent,
  VocabularyRelationType,
} from '@prisma/client';

/**
 * Kiểu dữ liệu chuẩn hoá giữa các provider bên ngoài và VocabularyService.
 * Mọi provider (dictionary / translation / AI) đều phải trả về theo khuôn này,
 * nhờ vậy đổi nhà cung cấp không ảnh hưởng tới service hay database.
 */

export interface EnrichedPronunciation {
  accent: PronunciationAccent;
  ipa: string | null;
  audioUrl: string | null;
}

export interface EnrichedExample {
  englishSentence: string;
  vietnameseTranslation: string | null;
  difficultyLevel: ExampleDifficulty;
}

export interface EnrichedMeaning {
  partOfSpeech: PartOfSpeech;
  englishDefinition: string | null;
  vietnameseMeaning: string | null;
  examples: EnrichedExample[];
}

export interface EnrichedRelation {
  relatedWord: string;
  relationType: VocabularyRelationType;
  /** Chỉ dùng cho WordForm: achievement (Noun), achievable (Adjective)… */
  partOfSpeech: PartOfSpeech | null;
}

export interface EnrichedWord {
  word: string;
  pronunciations: EnrichedPronunciation[];
  meanings: EnrichedMeaning[];
  relations: EnrichedRelation[];
  /** null khi không có nguồn đáng tin cậy — không tự đoán. */
  cefrLevel: CefrLevel | null;
  /** Provider nào đã đóng góp dữ liệu, để debug/hiển thị. */
  sources: string[];
}

/** Ném ra khi không provider nào tìm thấy từ — kèm gợi ý chính tả nếu có. */
export class WordNotFoundError extends Error {
  constructor(
    readonly word: string,
    readonly suggestions: string[] = [],
  ) {
    super(`Không tìm thấy "${word}".`);
    this.name = 'WordNotFoundError';
  }
}
