import { Module } from '@nestjs/common';
import { VocabularyController } from './controllers/vocabulary.controller';
import { AI_PROVIDER, ClaudeAiProvider } from './providers/ai.provider';
import { DICTIONARY_PROVIDER, FreeDictionaryProvider } from './providers/dictionary.provider';
import {
  DatamuseSpellSuggestionProvider,
  SPELL_SUGGESTION_PROVIDER,
} from './providers/spell-suggestion.provider';
import {
  MyMemoryTranslationProvider,
  TRANSLATION_PROVIDER,
} from './providers/translation.provider';
import { SpacedRepetitionService } from './services/spaced-repetition.service';
import { VocabularyEnrichmentService } from './services/vocabulary-enrichment.service';
import { VocabularyService } from './services/vocabulary.service';

/**
 * Học và quản lý từ vựng tiếng Anh cá nhân.
 *
 * Provider bên ngoài được đăng ký qua DI token, nên muốn đổi nhà cung cấp
 * (vd sang Oxford API hay Google Translate) chỉ cần thay `useClass` ở đây —
 * VocabularyEnrichmentService và VocabularyService không phải sửa dòng nào.
 */
@Module({
  controllers: [VocabularyController],
  providers: [
    VocabularyService,
    VocabularyEnrichmentService,
    SpacedRepetitionService,
    { provide: DICTIONARY_PROVIDER, useClass: FreeDictionaryProvider },
    { provide: TRANSLATION_PROVIDER, useClass: MyMemoryTranslationProvider },
    { provide: AI_PROVIDER, useClass: ClaudeAiProvider },
    { provide: SPELL_SUGGESTION_PROVIDER, useClass: DatamuseSpellSuggestionProvider },
  ],
})
export class VocabularyModule {}
