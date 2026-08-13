import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PronunciationButton } from '@/components/vocabulary/PronunciationButton';
import {
  CEFR_COLOR,
  LEARNING_STATUS_META,
  PART_OF_SPEECH_SHORT,
} from '@/lib/vocabulary-constants';
import { cn } from '@/lib/utils';
import type { Vocabulary } from '@/types/vocabulary';

interface Props {
  vocabulary: Vocabulary;
  index?: number;
  /** Người dùng bấm vào một gợi ý chính tả ("achive" -> "achieve") */
  onSuggestionClick?: (word: string) => void;
}

/** Card tóm tắt một từ — dùng chung cho màn "Từ vựng hôm nay" và danh sách. */
export function VocabularyCard({ vocabulary, index = 0, onSuggestionClick }: Props) {
  const status = LEARNING_STATUS_META[vocabulary.learningStatus];
  const primary = vocabulary.meanings[0];
  const example = primary?.examples[0];
  const synonyms = vocabulary.relations.filter((r) => r.relationType === 'Synonym');
  const pronunciation = vocabulary.pronunciations[0];

  return (
    <Card
      className="glass-panel animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both"
      style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/tu-vung/${vocabulary.id}`}
              className="text-lg font-semibold hover:text-primary"
            >
              {vocabulary.word}
            </Link>
            {pronunciation && (
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <span className="font-mono">{pronunciation.ipa ?? '—'}</span>
                <PronunciationButton
                  compact
                  word={vocabulary.word}
                  accent={pronunciation.accent}
                  audioUrl={pronunciation.audioUrl}
                />
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {vocabulary.cefrLevel && (
              <Badge
                variant="outline"
                style={{ borderColor: CEFR_COLOR[vocabulary.cefrLevel], color: CEFR_COLOR[vocabulary.cefrLevel] }}
              >
                {vocabulary.cefrLevel}
              </Badge>
            )}
            <span
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              title={status.label}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: status.color }} />
              {status.label}
            </span>
          </div>
        </div>

        <EnrichmentNotice vocabulary={vocabulary} onSuggestionClick={onSuggestionClick} />

        {primary && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {vocabulary.meanings.map((meaning) => (
                <Badge key={meaning.id} variant="secondary" className="font-normal">
                  {PART_OF_SPEECH_SHORT[meaning.partOfSpeech]}
                </Badge>
              ))}
            </div>

            {primary.vietnameseMeaning && (
              <p className="font-medium">{primary.vietnameseMeaning}</p>
            )}

            {synonyms.length > 0 && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground/70">Synonyms: </span>
                {synonyms.map((s) => s.relatedWord).join(' · ')}
              </p>
            )}

            {example && (
              <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-sm">
                <p className="italic">{example.englishSentence}</p>
                {example.vietnameseTranslation && (
                  <p className="mt-1 text-muted-foreground">{example.vietnameseTranslation}</p>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/tu-vung/${vocabulary.id}`}>
              Chi tiết
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Trạng thái tra từ điển: đang lấy / lỗi + gợi ý chính tả. */
function EnrichmentNotice({
  vocabulary,
  onSuggestionClick,
}: Pick<Props, 'vocabulary' | 'onSuggestionClick'>) {
  if (vocabulary.enrichmentStatus === 'Pending') {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Đang lấy thông tin từ vựng…
      </p>
    );
  }

  if (vocabulary.enrichmentStatus !== 'Failed') return null;

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
      <p className="flex items-start gap-2 text-destructive">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>{vocabulary.enrichmentError ?? 'Không lấy được dữ liệu từ điển.'}</span>
      </p>
      {vocabulary.enrichmentSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground">Có phải bạn muốn tìm:</span>
          {vocabulary.enrichmentSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick?.(suggestion)}
              className={cn(
                'rounded-md border border-border/60 px-2 py-0.5 font-medium transition-colors',
                onSuggestionClick ? 'hover:bg-accent' : 'cursor-default',
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
