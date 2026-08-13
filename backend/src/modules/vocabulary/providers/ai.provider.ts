import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CefrLevel, ExampleDifficulty, PartOfSpeech } from '@prisma/client';
import type { DictionaryEntry } from './dictionary.provider';

export const AI_PROVIDER = 'AI_PROVIDER';

export interface AiExample {
  englishSentence: string;
  vietnameseTranslation: string;
  difficultyLevel: ExampleDifficulty;
}

export interface AiMeaning {
  partOfSpeech: PartOfSpeech;
  englishDefinition: string;
  vietnameseMeaning: string;
  examples: AiExample[];
}

export interface AiWordForm {
  word: string;
  partOfSpeech: PartOfSpeech;
}

export interface AiEnrichment {
  /** false = AI không nhận ra đây là từ tiếng Anh có thật -> bỏ qua, không bịa. */
  found: boolean;
  cefrLevel: CefrLevel | null;
  meanings: AiMeaning[];
  synonyms: string[];
  antonyms: string[];
  wordForms: AiWordForm[];
}

/**
 * Bổ sung phần mà dictionary API không có: nghĩa tiếng Việt, câu ví dụ theo cấp độ
 * kèm bản dịch, các dạng khác của từ và trình độ CEFR.
 */
export interface AiProvider {
  isEnabled(): boolean;
  /** Trả null khi provider tắt hoặc gọi thất bại — enrichment vẫn chạy tiếp với dictionary. */
  enrich(word: string, dictionary: DictionaryEntry | null): Promise<AiEnrichment | null>;
}

const PART_OF_SPEECH_VALUES = Object.values(PartOfSpeech);
const CEFR_VALUES = Object.values(CefrLevel);
const DIFFICULTY_VALUES = Object.values(ExampleDifficulty);

// "unknown" thay cho null: JSON Schema của structured outputs không nhận nullable,
// và ta cần phân biệt rõ "AI không chắc" với "AI đoán bừa".
const UNKNOWN = 'unknown';

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    found: { type: 'boolean' },
    cefrLevel: { type: 'string', enum: [...CEFR_VALUES, UNKNOWN] },
    meanings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          partOfSpeech: { type: 'string', enum: PART_OF_SPEECH_VALUES },
          englishDefinition: { type: 'string' },
          vietnameseMeaning: { type: 'string' },
          examples: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                englishSentence: { type: 'string' },
                vietnameseTranslation: { type: 'string' },
                difficultyLevel: { type: 'string', enum: DIFFICULTY_VALUES },
              },
              required: ['englishSentence', 'vietnameseTranslation', 'difficultyLevel'],
              additionalProperties: false,
            },
          },
        },
        required: ['partOfSpeech', 'englishDefinition', 'vietnameseMeaning', 'examples'],
        additionalProperties: false,
      },
    },
    synonyms: { type: 'array', items: { type: 'string' } },
    antonyms: { type: 'array', items: { type: 'string' } },
    wordForms: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          word: { type: 'string' },
          partOfSpeech: { type: 'string', enum: PART_OF_SPEECH_VALUES },
        },
        required: ['word', 'partOfSpeech'],
        additionalProperties: false,
      },
    },
  },
  required: ['found', 'cefrLevel', 'meanings', 'synonyms', 'antonyms', 'wordForms'],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Bạn hỗ trợ một người Việt học từ vựng tiếng Anh.

Với mỗi từ được đưa vào, trả về dữ liệu tra cứu chính xác:
- Mỗi loại từ (part of speech) là một phần tử riêng trong "meanings". Từ như "address" phải có cả Noun và Verb.
- "vietnameseMeaning": nghĩa tiếng Việt tự nhiên, ngắn gọn. Nhiều nghĩa thì phân tách bằng " / ".
- "englishDefinition": một câu định nghĩa tiếng Anh đơn giản.
- "examples": đúng 3 câu cho mỗi nghĩa, độ khó tăng dần Basic -> Intermediate -> Advanced, kèm bản dịch tiếng Việt sát nghĩa.
- "wordForms": các dạng khác của từ cùng loại từ tương ứng (achieve -> achievement/Noun, achievable/Adjective). Không có thì để mảng rỗng.

Quy tắc bắt buộc:
- Không bịa. Nếu chuỗi đưa vào không phải từ/cụm tiếng Anh có thật, đặt "found" = false và để mọi mảng rỗng.
- "cefrLevel" chỉ điền khi bạn thực sự chắc chắn về mức CEFR chuẩn của từ; nếu không chắc hãy đặt "${UNKNOWN}".
- Chỉ trả JSON đúng schema, không thêm lời dẫn.`;

/** Claude (Anthropic Messages API) qua official SDK, dùng structured outputs để ép đúng schema. */
@Injectable()
export class ClaudeAiProvider implements AiProvider {
  private readonly logger = new Logger(ClaudeAiProvider.name);
  private client?: Anthropic;

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return !!this.config.get<string>('vocabulary.ai.apiKey');
  }

  async enrich(word: string, dictionary: DictionaryEntry | null): Promise<AiEnrichment | null> {
    if (!this.isEnabled()) return null;

    try {
      const response = await this.getClient().messages.create({
        model: this.config.get<string>('vocabulary.ai.model') ?? 'claude-opus-5',
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        output_config: {
          effort: 'low',
          format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
        },
        messages: [{ role: 'user', content: this.buildPrompt(word, dictionary) }],
      });

      if (response.stop_reason === 'refusal') {
        this.logger.warn(`Claude từ chối xử lý "${word}".`);
        return null;
      }

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      return text ? this.parse(JSON.parse(text)) : null;
    } catch (error) {
      // AI chỉ là nguồn bổ sung -> lỗi ở đây không được làm hỏng cả quá trình enrich
      this.logger.warn(`Enrich "${word}" bằng AI thất bại: ${(error as Error).message}`);
      return null;
    }
  }

  private getClient(): Anthropic {
    this.client ??= new Anthropic({
      apiKey: this.config.get<string>('vocabulary.ai.apiKey'),
      baseURL: this.baseUrl(),
      timeout: this.config.get<number>('vocabulary.ai.timeoutMs') ?? 60000,
    });
    return this.client;
  }

  /** Config lưu URL đầy đủ tới /v1/messages, SDK lại cần base URL. */
  private baseUrl(): string | undefined {
    const endpoint = this.config.get<string>('vocabulary.ai.endpoint');
    if (!endpoint) return undefined;
    const base = endpoint.replace(/\/v1\/messages\/?$/, '');
    return base && base !== endpoint ? base : endpoint;
  }

  /** Đưa kết quả từ điển vào prompt để AI bám theo nguồn thay vì tự nghĩ ra nghĩa. */
  private buildPrompt(word: string, dictionary: DictionaryEntry | null): string {
    if (!dictionary?.definitions.length) {
      return `Từ cần tra: "${word}"\n\n(Từ điển không có dữ liệu cho từ này.)`;
    }

    const definitions = dictionary.definitions
      .slice(0, 10)
      .map((d) => `- [${d.partOfSpeech}] ${d.definition}`)
      .join('\n');

    const lines = [`Từ cần tra: "${word}"`, '', 'Dữ liệu từ điển tham khảo:', definitions];
    if (dictionary.synonyms.length) {
      lines.push('', `Synonyms từ từ điển: ${dictionary.synonyms.join(', ')}`);
    }
    if (dictionary.antonyms.length) {
      lines.push(`Antonyms từ từ điển: ${dictionary.antonyms.join(', ')}`);
    }
    return lines.join('\n');
  }

  private parse(raw: unknown): AiEnrichment | null {
    // Schema đã ép Claude trả đúng khuôn, nhưng cefrLevel còn nhận thêm sentinel "unknown"
    const data = raw as Omit<Partial<AiEnrichment>, 'cefrLevel'> & { cefrLevel?: string };
    if (!data || typeof data !== 'object' || data.found !== true) return null;

    const cefr = data.cefrLevel;
    return {
      found: true,
      cefrLevel: cefr && cefr !== UNKNOWN ? (cefr as CefrLevel) : null,
      meanings: (data.meanings ?? []).filter((m) => m?.partOfSpeech),
      synonyms: (data.synonyms ?? []).filter(Boolean),
      antonyms: (data.antonyms ?? []).filter(Boolean),
      wordForms: (data.wordForms ?? []).filter((f) => f?.word),
    };
  }
}
