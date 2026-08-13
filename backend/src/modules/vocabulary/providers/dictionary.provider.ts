import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PartOfSpeech } from '@prisma/client';
import type { EnrichedPronunciation } from '../types/enriched-word';

export const DICTIONARY_PROVIDER = 'DICTIONARY_PROVIDER';

export interface DictionaryDefinition {
  partOfSpeech: PartOfSpeech;
  definition: string;
  /** Câu ví dụ gốc (tiếng Anh) nếu từ điển có kèm. */
  example: string | null;
}

export interface DictionaryEntry {
  word: string;
  pronunciations: EnrichedPronunciation[];
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
}

/**
 * Nguồn tra cứu IPA / audio / định nghĩa tiếng Anh / synonym / antonym.
 * Đổi nhà cung cấp = đăng ký implement khác cho token DICTIONARY_PROVIDER.
 */
export interface DictionaryProvider {
  /** Trả về null khi từ điển không có từ này (không phải lỗi hệ thống). */
  lookup(word: string): Promise<DictionaryEntry | null>;
}

// dictionaryapi.dev trả partOfSpeech dạng chữ thường tự do -> map về enum của mình
const PART_OF_SPEECH_MAP: Record<string, PartOfSpeech> = {
  noun: PartOfSpeech.Noun,
  verb: PartOfSpeech.Verb,
  adjective: PartOfSpeech.Adjective,
  adverb: PartOfSpeech.Adverb,
  pronoun: PartOfSpeech.Pronoun,
  preposition: PartOfSpeech.Preposition,
  conjunction: PartOfSpeech.Conjunction,
  interjection: PartOfSpeech.Interjection,
  exclamation: PartOfSpeech.Interjection,
  'phrasal verb': PartOfSpeech.PhrasalVerb,
  idiom: PartOfSpeech.Idiom,
  phrase: PartOfSpeech.Phrase,
};

export function toPartOfSpeech(value?: string | null): PartOfSpeech {
  if (!value) return PartOfSpeech.Other;
  return PART_OF_SPEECH_MAP[value.trim().toLowerCase()] ?? PartOfSpeech.Other;
}

// ----- Shape trả về của api.dictionaryapi.dev (chỉ khai báo phần mình dùng) -----
interface RawPhonetic {
  text?: string;
  audio?: string;
}
interface RawDefinition {
  definition?: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}
interface RawMeaning {
  partOfSpeech?: string;
  definitions?: RawDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}
interface RawEntry {
  word?: string;
  phonetic?: string;
  phonetics?: RawPhonetic[];
  meanings?: RawMeaning[];
}

/** Free Dictionary API (api.dictionaryapi.dev) — miễn phí, không cần API key. */
@Injectable()
export class FreeDictionaryProvider implements DictionaryProvider {
  private readonly logger = new Logger(FreeDictionaryProvider.name);

  constructor(private readonly config: ConfigService) {}

  async lookup(word: string): Promise<DictionaryEntry | null> {
    const endpoint = this.config.get<string>('vocabulary.dictionary.endpoint');
    const timeoutMs = this.config.get<number>('vocabulary.dictionary.timeoutMs') ?? 8000;
    if (!endpoint) return null;

    const url = `${endpoint.replace(/\/$/, '')}/${encodeURIComponent(word)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });

    // 404 = từ điển không có từ này, đây là kết quả hợp lệ chứ không phải sự cố
    if (response.status === 404) {
      this.logger.debug(`Không tìm thấy "${word}" trong từ điển.`);
      return null;
    }
    if (!response.ok) {
      throw new Error(`Dictionary API trả ${response.status}`);
    }

    const entries = (await response.json()) as RawEntry[];
    if (!Array.isArray(entries) || !entries.length) return null;

    return this.normalize(word, entries);
  }

  private normalize(word: string, entries: RawEntry[]): DictionaryEntry {
    const definitions: DictionaryDefinition[] = [];
    const synonyms = new Set<string>();
    const antonyms = new Set<string>();

    for (const entry of entries) {
      for (const meaning of entry.meanings ?? []) {
        const partOfSpeech = toPartOfSpeech(meaning.partOfSpeech);
        for (const raw of meaning.definitions ?? []) {
          if (!raw.definition?.trim()) continue;
          definitions.push({
            partOfSpeech,
            definition: raw.definition.trim(),
            example: raw.example?.trim() || null,
          });
          raw.synonyms?.forEach((s) => synonyms.add(s));
          raw.antonyms?.forEach((a) => antonyms.add(a));
        }
        meaning.synonyms?.forEach((s) => synonyms.add(s));
        meaning.antonyms?.forEach((a) => antonyms.add(a));
      }
    }

    return {
      word: entries[0].word?.trim() || word,
      pronunciations: this.extractPronunciations(entries),
      definitions,
      synonyms: this.cleanWordList(synonyms, word),
      antonyms: this.cleanWordList(antonyms, word),
    };
  }

  /**
   * Tách phiên âm theo giọng. API đặt tên file audio dạng "<word>-uk.mp3" / "-us.mp3"
   * nên nhận diện được UK/US; phần IPA không gắn giọng thì dùng làm mặc định cho cả hai.
   */
  private extractPronunciations(entries: RawEntry[]): EnrichedPronunciation[] {
    const uk: EnrichedPronunciation = { accent: 'UK', ipa: null, audioUrl: null };
    const us: EnrichedPronunciation = { accent: 'US', ipa: null, audioUrl: null };
    let fallbackIpa: string | null = null;

    for (const entry of entries) {
      if (!fallbackIpa && entry.phonetic?.trim()) fallbackIpa = entry.phonetic.trim();

      for (const phonetic of entry.phonetics ?? []) {
        const text = phonetic.text?.trim() || null;
        const audio = phonetic.audio?.trim() || null;
        const accent = audio ? this.detectAccent(audio) : null;

        if (accent === 'UK') {
          uk.ipa ??= text;
          uk.audioUrl ??= audio;
        } else if (accent === 'US') {
          us.ipa ??= text;
          us.audioUrl ??= audio;
        } else if (text && !fallbackIpa) {
          fallbackIpa = text;
        }
      }
    }

    uk.ipa ??= fallbackIpa;
    us.ipa ??= fallbackIpa;

    return [uk, us].filter((p) => p.ipa || p.audioUrl);
  }

  private detectAccent(audioUrl: string): 'UK' | 'US' | null {
    const lower = audioUrl.toLowerCase();
    if (lower.includes('-uk.') || lower.includes('-gb.')) return 'UK';
    if (lower.includes('-us.')) return 'US';
    return null;
  }

  /** Bỏ trùng, bỏ chính nó, cắt bớt cho gọn. */
  private cleanWordList(values: Set<string>, self: string): string[] {
    const selfKey = self.trim().toLowerCase();
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of values) {
      const word = value.trim();
      const key = word.toLowerCase();
      if (!word || key === selfKey || seen.has(key)) continue;
      seen.add(key);
      result.push(word);
      if (result.length >= 12) break;
    }
    return result;
  }
}
