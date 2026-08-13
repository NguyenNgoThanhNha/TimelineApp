import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PronunciationButton } from '@/components/vocabulary/PronunciationButton';
import {
  CEFR_COLOR,
  PART_OF_SPEECH_SHORT,
  REVIEW_RESULT_META,
} from '@/lib/vocabulary-constants';
import type { ReviewResult, Vocabulary } from '@/types/vocabulary';

/** Thứ tự nút khớp với phím tắt 1-4. */
const RATINGS: ReviewResult[] = ['Again', 'Hard', 'Good', 'Easy'];

interface Props {
  vocabulary: Vocabulary;
  revealed: boolean;
  onReveal: () => void;
  onRate: (result: ReviewResult) => void;
  disabled?: boolean;
}

/**
 * Mặt trước chỉ có từ + phiên âm; bấm "Hiện đáp án" mới lộ nghĩa và ví dụ.
 * Sau đó người học tự chấm 4 mức — kết quả này là đầu vào của SM-2.
 */
export function Flashcard({ vocabulary, revealed, onReveal, onRate, disabled }: Props) {
  const primary = vocabulary.meanings[0];
  const example = primary?.examples[0];

  return (
    <Card className="glass-panel">
      <CardContent className="space-y-6 p-8">
        {/* ----- Mặt trước ----- */}
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-4xl font-bold uppercase tracking-tight">{vocabulary.word}</h2>
            {vocabulary.cefrLevel && (
              <Badge
                variant="outline"
                style={{
                  borderColor: CEFR_COLOR[vocabulary.cefrLevel],
                  color: CEFR_COLOR[vocabulary.cefrLevel],
                }}
              >
                {vocabulary.cefrLevel}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {vocabulary.pronunciations.length > 0 ? (
              vocabulary.pronunciations.map((pronunciation) => (
                <PronunciationButton
                  key={pronunciation.id}
                  word={vocabulary.word}
                  accent={pronunciation.accent}
                  ipa={pronunciation.ipa}
                  audioUrl={pronunciation.audioUrl}
                />
              ))
            ) : (
              <PronunciationButton word={vocabulary.word} accent="UK" />
            )}
          </div>
        </div>

        {/* ----- Mặt sau ----- */}
        {!revealed ? (
          <div className="flex justify-center pt-2">
            <Button size="lg" onClick={onReveal}>
              <Eye className="size-4" />
              Hiện đáp án
              <kbd className="ml-1 rounded border border-primary-foreground/30 px-1.5 text-xs">
                Space
              </kbd>
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 space-y-5 border-t border-border/40 pt-6">
            {vocabulary.meanings.map((meaning) => (
              <div key={meaning.id} className="space-y-1 text-center">
                <Badge variant="secondary" className="font-normal">
                  {PART_OF_SPEECH_SHORT[meaning.partOfSpeech]}
                </Badge>
                {meaning.vietnameseMeaning && (
                  <p className="text-xl font-semibold">{meaning.vietnameseMeaning}</p>
                )}
                {meaning.englishDefinition && (
                  <p className="text-sm text-muted-foreground">{meaning.englishDefinition}</p>
                )}
              </div>
            ))}

            {example && (
              <div className="rounded-lg border border-border/40 bg-background/40 p-4 text-center text-sm">
                <p className="italic">{example.englishSentence}</p>
                {example.vietnameseTranslation && (
                  <p className="mt-1 text-muted-foreground">{example.vietnameseTranslation}</p>
                )}
              </div>
            )}

            {vocabulary.note && (
              <p className="rounded-lg bg-muted/50 p-3 text-center text-sm text-muted-foreground">
                {vocabulary.note}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4">
              {RATINGS.map((result, index) => {
                const meta = REVIEW_RESULT_META[result];
                return (
                  <Button
                    key={result}
                    variant="outline"
                    disabled={disabled}
                    onClick={() => onRate(result)}
                    className="h-auto flex-col gap-0.5 py-3"
                    style={{ borderColor: `${meta.color}66`, color: meta.color }}
                  >
                    <span className="font-semibold">{meta.label}</span>
                    <span className="text-xs opacity-60">{index + 1}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
