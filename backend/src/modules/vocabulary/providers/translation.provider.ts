import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const TRANSLATION_PROVIDER = 'TRANSLATION_PROVIDER';

/** Dịch Anh -> Việt. Dùng làm phương án dự phòng khi không cấu hình AI provider. */
export interface TranslationProvider {
  isEnabled(): boolean;
  /** Trả null nếu không dịch được — service sẽ để trống thay vì bịa nghĩa. */
  translate(text: string): Promise<string | null>;
}

interface MyMemoryResponse {
  responseStatus?: number | string;
  responseData?: { translatedText?: string };
}

/** MyMemory (api.mymemory.translated.net) — miễn phí, không cần key, có giới hạn quota. */
@Injectable()
export class MyMemoryTranslationProvider implements TranslationProvider {
  private readonly logger = new Logger(MyMemoryTranslationProvider.name);

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('vocabulary.translation.enabled') ?? false;
  }

  async translate(text: string): Promise<string | null> {
    const trimmed = text.trim();
    if (!this.isEnabled() || !trimmed) return null;

    const endpoint = this.config.get<string>('vocabulary.translation.endpoint');
    const timeoutMs = this.config.get<number>('vocabulary.translation.timeoutMs') ?? 8000;
    const email = this.config.get<string>('vocabulary.translation.contactEmail');
    if (!endpoint) return null;

    const params = new URLSearchParams({ q: trimmed, langpair: 'en|vi' });
    if (email) params.set('de', email);

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) return null;

      const body = (await response.json()) as MyMemoryResponse;
      const translated = body.responseData?.translatedText?.trim();
      // MyMemory nhét thông báo quota vào chính trường dịch -> loại bỏ
      if (!translated || translated.toUpperCase().includes('MYMEMORY WARNING')) return null;
      return translated;
    } catch (error) {
      this.logger.warn(`Dịch "${trimmed}" thất bại: ${(error as Error).message}`);
      return null;
    }
  }
}
