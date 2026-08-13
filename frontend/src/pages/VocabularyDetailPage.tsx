import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PronunciationButton } from '@/components/vocabulary/PronunciationButton';
import { SrsPanel } from '@/components/vocabulary/SrsPanel';
import {
  useAddVocabulary,
  useDeleteVocabulary,
  useRefreshVocabulary,
  useUpdateVocabulary,
  useVocabulary,
} from '@/hooks/useVocabulary';
import {
  CEFR_COLOR,
  DIFFICULTY_META,
  LEARNING_STATUS_META,
  LEARNING_STATUS_OPTIONS,
  PART_OF_SPEECH_LABEL,
  PART_OF_SPEECH_SHORT,
} from '@/lib/vocabulary-constants';
import { formatVnDate } from '@/lib/vocabulary-format';
import type { LearningStatus, Vocabulary, VocabularyRelation } from '@/types/vocabulary';

export function VocabularyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useVocabulary(id);
  const update = useUpdateVocabulary();
  const refresh = useRefreshVocabulary();
  const remove = useDeleteVocabulary();

  if (isLoading) {
    return (
      <Card className="glass-panel">
        <CardContent className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
          <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
          Đang tải…
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="glass-panel border-destructive/30 bg-destructive/5">
        <CardContent className="py-8 text-center text-destructive">
          {(error as Error)?.message ?? 'Không tìm thấy từ vựng'}
        </CardContent>
      </Card>
    );
  }

  const status = LEARNING_STATUS_META[data.learningStatus];
  const synonyms = data.relations.filter((r) => r.relationType === 'Synonym');
  const antonyms = data.relations.filter((r) => r.relationType === 'Antonym');
  const wordForms = data.relations.filter((r) => r.relationType === 'WordForm');

  const confirmRemove = async () => {
    if (!window.confirm(`Xoá "${data.word}" khỏi bộ từ vựng?`)) return;
    await remove.mutateAsync(data.id);
    navigate('/tu-vung/danh-sach');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/tu-vung/danh-sach">
            <ArrowLeft className="size-4" />
            Danh sách từ vựng
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh.mutate(data.id)}
            disabled={refresh.isPending}
            title="Gọi lại dictionary API để lấy dữ liệu mới"
          >
            <RefreshCw className={refresh.isPending ? 'size-4 animate-spin' : 'size-4'} />
            Refresh từ điển
          </Button>
          <Button variant="ghost" size="sm" onClick={confirmRemove} disabled={remove.isPending}>
            <Trash2 className="size-4" />
            Xoá
          </Button>
        </div>
      </div>

      {/* ----- Header: từ, CEFR, phiên âm ----- */}
      <Card className="glass-panel">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-bold uppercase tracking-tight">{data.word}</h1>
            {data.cefrLevel && (
              <Badge
                variant="outline"
                className="text-sm"
                style={{ borderColor: CEFR_COLOR[data.cefrLevel], color: CEFR_COLOR[data.cefrLevel] }}
              >
                {data.cefrLevel}
              </Badge>
            )}
          </div>

          {data.pronunciations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.pronunciations.map((pronunciation) => (
                <PronunciationButton
                  key={pronunciation.id}
                  word={data.word}
                  accent={pronunciation.accent}
                  ipa={pronunciation.ipa}
                  audioUrl={pronunciation.audioUrl}
                />
              ))}
            </div>
          ) : (
            // Không có IPA vẫn cho nghe bằng Text-to-Speech
            <div className="flex flex-wrap gap-2">
              <PronunciationButton word={data.word} accent="UK" />
              <PronunciationButton word={data.word} accent="US" />
            </div>
          )}

          {data.enrichmentStatus === 'Pending' && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang lấy thông tin từ vựng…
            </p>
          )}
          {data.enrichmentStatus === 'Failed' && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {data.enrichmentError ?? 'Không lấy được dữ liệu từ điển.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ----- Nghĩa theo từng loại từ ----- */}
      {data.meanings.map((meaning) => (
        <Card key={meaning.id} className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-baseline gap-2 text-base">
              <span>{PART_OF_SPEECH_SHORT[meaning.partOfSpeech]}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {PART_OF_SPEECH_LABEL[meaning.partOfSpeech]}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {meaning.vietnameseMeaning && (
              <p className="text-lg font-semibold uppercase">{meaning.vietnameseMeaning}</p>
            )}
            {meaning.englishDefinition && (
              <p className="text-muted-foreground">{meaning.englishDefinition}</p>
            )}

            {meaning.examples.length > 0 && (
              <div className="space-y-3 border-t border-border/40 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Examples
                </p>
                {meaning.examples.map((example, index) => (
                  <div key={example.id} className="flex gap-3 text-sm">
                    <span className="mt-0.5 text-muted-foreground tabular-nums">{index + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <p className="italic">{example.englishSentence}</p>
                        <Badge variant="secondary" className="shrink-0 font-normal">
                          {DIFFICULTY_META[example.difficultyLevel].label}
                        </Badge>
                      </div>
                      {example.vietnameseTranslation && (
                        <p className="mt-1 text-muted-foreground">{example.vietnameseTranslation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* ----- Synonym / Antonym / dạng khác ----- */}
      {(synonyms.length > 0 || antonyms.length > 0 || wordForms.length > 0) && (
        <Card className="glass-panel">
          <CardContent className="space-y-4 p-6">
            <RelationGroup title="Synonyms" relations={synonyms} />
            <RelationGroup title="Antonyms" relations={antonyms} />
            <RelationGroup title="Word forms" relations={wordForms} showPartOfSpeech />
          </CardContent>
        </Card>
      )}

      {/* ----- Trạng thái học, ngày học, ghi chú ----- */}
      <Card className="glass-panel">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ngày học</p>
            <p className="mt-1 font-medium">{formatVnDate(data.learnedDate)}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: status.color }} />
              <select
                className="flex h-9 flex-1 rounded-md border border-input/70 bg-background/50 px-3 text-sm shadow-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={data.learningStatus}
                onChange={(event) =>
                  update.mutate({
                    id: data.id,
                    body: { learningStatus: event.target.value as LearningStatus },
                  })
                }
              >
                {LEARNING_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-2">
            <NoteEditor vocabulary={data} />
          </div>

        </CardContent>
      </Card>

      <SrsPanel vocabulary={data} />
    </div>
  );
}

/** Chip synonym/antonym: đã học -> mở chi tiết; chưa học -> mời thêm (không tự động thêm). */
function RelationGroup({
  title,
  relations,
  showPartOfSpeech,
}: {
  title: string;
  relations: VocabularyRelation[];
  showPartOfSpeech?: boolean;
}) {
  const addWord = useAddVocabulary();
  if (!relations.length) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {relations.map((relation) => {
          const label = showPartOfSpeech && relation.partOfSpeech
            ? `${relation.relatedWord} (${PART_OF_SPEECH_SHORT[relation.partOfSpeech].toLowerCase()})`
            : relation.relatedWord;

          return relation.relatedVocabularyId ? (
            <Link
              key={relation.id}
              to={`/tu-vung/${relation.relatedVocabularyId}`}
              className="rounded-md border border-primary/40 bg-primary/5 px-2.5 py-1 text-sm text-primary transition-colors hover:bg-primary/10"
            >
              {label}
            </Link>
          ) : (
            <button
              key={relation.id}
              type="button"
              disabled={addWord.isPending}
              onClick={() => addWord.mutate({ word: relation.relatedWord })}
              title="Thêm vào danh sách học"
              className="group inline-flex items-center gap-1 rounded-md border border-border/60 px-2.5 py-1 text-sm transition-colors hover:bg-accent"
            >
              {label}
              <Plus className="size-3 opacity-0 transition-opacity group-hover:opacity-70" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NoteEditor({ vocabulary }: { vocabulary: Vocabulary }) {
  const update = useUpdateVocabulary();
  const [note, setNote] = useState(vocabulary.note ?? '');

  // Đồng bộ lại khi chuyển sang từ khác hoặc sau khi refresh dữ liệu
  useEffect(() => setNote(vocabulary.note ?? ''), [vocabulary.id, vocabulary.note]);

  const isDirty = note !== (vocabulary.note ?? '');

  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Ghi chú</p>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        placeholder="Cách nhớ, ngữ cảnh gặp từ này…"
        className="w-full resize-y rounded-md border border-input/70 bg-background/50 p-3 text-sm shadow-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {isDirty && (
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setNote(vocabulary.note ?? '')}>
            Huỷ
          </Button>
          <Button
            size="sm"
            disabled={update.isPending}
            onClick={() => update.mutate({ id: vocabulary.id, body: { note } })}
          >
            Lưu ghi chú
          </Button>
        </div>
      )}
    </div>
  );
}
