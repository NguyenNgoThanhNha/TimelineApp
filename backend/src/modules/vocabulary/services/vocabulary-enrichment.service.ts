import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExampleDifficulty, PartOfSpeech, VocabularyRelationType } from '@prisma/client';
import {
  AI_PROVIDER,
  type AiEnrichment,
  type AiProvider,
} from '../providers/ai.provider';
import {
  DICTIONARY_PROVIDER,
  type DictionaryEntry,
  type DictionaryProvider,
} from '../providers/dictionary.provider';
import {
  SPELL_SUGGESTION_PROVIDER,
  type SpellSuggestionProvider,
} from '../providers/spell-suggestion.provider';
import {
  TRANSLATION_PROVIDER,
  type TranslationProvider,
} from '../providers/translation.provider';
import {
  WordNotFoundError,
  type EnrichedExample,
  type EnrichedMeaning,
  type EnrichedRelation,
  type EnrichedWord,
} from '../types/enriched-word';

const MAX_MEANINGS = 4;
const MAX_EXAMPLES_PER_MEANING = 3;
const MAX_SYNONYMS = 8;
const MAX_ANTONYMS = 6;
const MAX_WORD_FORMS = 6;
/** Trần số lần gọi dịch máy cho một từ, tránh đốt quota MyMemory. */
const MAX_FALLBACK_TRANSLATIONS = 5;

const DIFFICULTY_ORDER: ExampleDifficulty[] = [
  ExampleDifficulty.Basic,
  ExampleDifficulty.Intermediate,
  ExampleDifficulty.Advanced,
];

/**
 * Điều phối các provider bên ngoài và chuẩn hoá kết quả về EnrichedWord.
 *
 *   VocabularyService -> VocabularyEnrichmentService -> Dictionary | Translation | AI
 *
 * Controller không bao giờ chạm tới provider. Service này cũng không đụng database:
 * nó chỉ nhận vào một chuỗi và trả ra dữ liệu đã chuẩn hoá.
 */
@Injectable()
export class VocabularyEnrichmentService {
  private readonly logger = new Logger(VocabularyEnrichmentService.name);

  constructor(
    @Inject(DICTIONARY_PROVIDER) private readonly dictionary: DictionaryProvider,
    @Inject(TRANSLATION_PROVIDER) private readonly translation: TranslationProvider,
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
    @Inject(SPELL_SUGGESTION_PROVIDER) private readonly spelling: SpellSuggestionProvider,
  ) {}

  /**
   * @throws WordNotFoundError khi không nguồn nào biết từ này (kèm gợi ý chính tả).
   * @throws Error khi provider gặp sự cố kỹ thuật -> caller đánh dấu Failed và cho retry.
   */
  async enrich(word: string): Promise<EnrichedWord> {
    const dictionary = await this.lookupDictionary(word);
    const ai = await this.ai.enrich(word, dictionary);

    if (!dictionary && !ai) {
      throw new WordNotFoundError(word, await this.spelling.suggest(word));
    }

    const sources: string[] = [];
    if (dictionary) sources.push('dictionary');
    if (ai) sources.push('ai');

    const meanings = ai
      ? this.meaningsFromAi(ai)
      : await this.meaningsFromDictionary(word, dictionary!);
    if (!ai && this.translation.isEnabled()) sources.push('translation');

    return {
      word: dictionary?.word || word,
      pronunciations: dictionary?.pronunciations ?? [],
      meanings,
      relations: this.buildRelations(word, dictionary, ai),
      cefrLevel: ai?.cefrLevel ?? null, // không có nguồn đáng tin cậy -> để null
      sources,
    };
  }

  /** Gợi ý "có phải bạn muốn tìm…" — dùng cho endpoint tra thử trước khi thêm. */
  suggest(word: string): Promise<string[]> {
    return this.spelling.suggest(word);
  }

  private async lookupDictionary(word: string): Promise<DictionaryEntry | null> {
    try {
      return await this.dictionary.lookup(word);
    } catch (error) {
      // Từ điển lỗi không được chặn AI: vẫn còn cơ hội enrich được
      this.logger.warn(`Tra từ điển "${word}" thất bại: ${(error as Error).message}`);
      return null;
    }
  }

  private meaningsFromAi(ai: AiEnrichment): EnrichedMeaning[] {
    return ai.meanings.slice(0, MAX_MEANINGS).map((meaning) => ({
      partOfSpeech: meaning.partOfSpeech,
      englishDefinition: meaning.englishDefinition?.trim() || null,
      vietnameseMeaning: meaning.vietnameseMeaning?.trim() || null,
      examples: this.sortByDifficulty(
        meaning.examples
          .filter((example) => example?.englishSentence?.trim())
          .slice(0, MAX_EXAMPLES_PER_MEANING)
          .map((example) => ({
            englishSentence: example.englishSentence.trim(),
            vietnameseTranslation: example.vietnameseTranslation?.trim() || null,
            difficultyLevel: example.difficultyLevel ?? ExampleDifficulty.Basic,
          })),
      ),
    }));
  }

  /**
   * Không có AI: dựng nghĩa từ dictionary, mỗi loại từ một nghĩa,
   * rồi dịch máy phần tiếng Việt trong hạn mức cho phép.
   */
  private async meaningsFromDictionary(
    word: string,
    dictionary: DictionaryEntry,
  ): Promise<EnrichedMeaning[]> {
    const byPartOfSpeech = new Map<PartOfSpeech, EnrichedMeaning>();

    for (const definition of dictionary.definitions) {
      let meaning = byPartOfSpeech.get(definition.partOfSpeech);
      if (!meaning) {
        if (byPartOfSpeech.size >= MAX_MEANINGS) continue;
        meaning = {
          partOfSpeech: definition.partOfSpeech,
          englishDefinition: definition.definition,
          vietnameseMeaning: null,
          examples: [],
        };
        byPartOfSpeech.set(definition.partOfSpeech, meaning);
      }
      if (definition.example && meaning.examples.length < MAX_EXAMPLES_PER_MEANING) {
        meaning.examples.push({
          englishSentence: definition.example,
          vietnameseTranslation: null,
          // Không có dữ liệu phân loại -> để Basic thay vì tự gán bừa cấp độ
          difficultyLevel: ExampleDifficulty.Basic,
        });
      }
    }

    const meanings = [...byPartOfSpeech.values()];
    if (!this.translation.isEnabled()) return meanings;

    // Dịch chính từ đó một lần, dùng chung cho mọi loại từ (không có nguồn nghĩa riêng theo POS)
    const vietnameseWord = await this.translation.translate(word);
    let budget = MAX_FALLBACK_TRANSLATIONS - 1;

    for (const meaning of meanings) {
      meaning.vietnameseMeaning = vietnameseWord;
      for (const example of meaning.examples) {
        if (budget <= 0) break;
        budget--;
        example.vietnameseTranslation = await this.translation.translate(example.englishSentence);
      }
    }

    return meanings;
  }

  private sortByDifficulty(examples: EnrichedExample[]): EnrichedExample[] {
    return [...examples].sort(
      (a, b) =>
        DIFFICULTY_ORDER.indexOf(a.difficultyLevel) - DIFFICULTY_ORDER.indexOf(b.difficultyLevel),
    );
  }

  /** Gộp synonym/antonym của cả hai nguồn + word form từ AI, bỏ trùng và bỏ chính nó. */
  private buildRelations(
    word: string,
    dictionary: DictionaryEntry | null,
    ai: AiEnrichment | null,
  ): EnrichedRelation[] {
    const relations: EnrichedRelation[] = [];
    const seen = new Set<string>([word.trim().toLowerCase()]);

    const push = (
      candidate: string,
      relationType: VocabularyRelationType,
      partOfSpeech: PartOfSpeech | null,
      limit: number,
    ) => {
      const value = candidate.trim();
      const key = `${relationType}:${value.toLowerCase()}`;
      if (!value || seen.has(value.toLowerCase()) || seen.has(key)) return;
      if (relations.filter((r) => r.relationType === relationType).length >= limit) return;
      seen.add(key);
      relations.push({ relatedWord: value, relationType, partOfSpeech });
    };

    for (const synonym of [...(ai?.synonyms ?? []), ...(dictionary?.synonyms ?? [])]) {
      push(synonym, VocabularyRelationType.Synonym, null, MAX_SYNONYMS);
    }
    for (const antonym of [...(ai?.antonyms ?? []), ...(dictionary?.antonyms ?? [])]) {
      push(antonym, VocabularyRelationType.Antonym, null, MAX_ANTONYMS);
    }
    for (const form of ai?.wordForms ?? []) {
      push(form.word, VocabularyRelationType.WordForm, form.partOfSpeech ?? null, MAX_WORD_FORMS);
    }

    return relations;
  }
}
