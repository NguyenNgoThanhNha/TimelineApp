import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const SPELL_SUGGESTION_PROVIDER = 'SPELL_SUGGESTION_PROVIDER';

/** Gợi ý "có phải bạn muốn tìm…" khi từ điển không có từ user vừa nhập. */
export interface SpellSuggestionProvider {
  suggest(word: string): Promise<string[]>;
}

/** Datamuse (api.datamuse.com) — tra từ gần đúng theo cách viết, miễn phí, không cần key. */
@Injectable()
export class DatamuseSpellSuggestionProvider implements SpellSuggestionProvider {
  private readonly logger = new Logger(DatamuseSpellSuggestionProvider.name);

  constructor(private readonly config: ConfigService) {}

  async suggest(word: string): Promise<string[]> {
    const endpoint = this.config.get<string>('vocabulary.spellSuggestion.endpoint');
    const timeoutMs = this.config.get<number>('vocabulary.spellSuggestion.timeoutMs') ?? 5000;
    const trimmed = word.trim();
    if (!endpoint || !trimmed) return [];

    // sp = spelled-like: gợi ý từ có cách viết gần giống
    const params = new URLSearchParams({ sp: trimmed, max: '5' });

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) return [];

      const rows = (await response.json()) as Array<{ word?: string }>;
      const selfKey = trimmed.toLowerCase();
      return rows
        .map((row) => row.word?.trim() ?? '')
        .filter((candidate) => candidate && candidate.toLowerCase() !== selfKey)
        .slice(0, 5);
    } catch (error) {
      this.logger.warn(`Gợi ý chính tả cho "${trimmed}" thất bại: ${(error as Error).message}`);
      return [];
    }
  }
}
