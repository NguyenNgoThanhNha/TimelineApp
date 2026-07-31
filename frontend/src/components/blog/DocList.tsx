import { Link } from 'react-router-dom';
import { ChevronRight, FileText, Pencil, Trash2 } from 'lucide-react';
import type { DocRef } from '@/types/blog';
import { Button } from '@/components/ui/button';

interface Props {
  docs: DocRef[];
  onEdit?: (doc: DocRef) => void;
  onDelete?: (doc: DocRef) => void;
  emptyText?: string;
}

/** Danh sách trang tài liệu nội bộ — mỗi dòng dẫn sang trang đọc đầy đủ. */
export function DocList({ docs, onEdit, onDelete, emptyText }: Props) {
  if (!docs.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyText ?? 'Chưa có trang tài liệu nào.'}
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {docs.map((doc, index) => (
        <li
          key={doc.id}
          className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3 transition-colors hover:border-primary/40"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
            {index + 1}
          </span>

          <Link to={`/tai-lieu/${doc.slug}`} className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-medium leading-snug group-hover:text-primary">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{doc.title}</span>
            </p>
            {doc.summary && (
              <p className="mt-0.5 line-clamp-2 pl-6 text-sm text-muted-foreground">{doc.summary}</p>
            )}
          </Link>

          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Sửa ${doc.title}`}
              onClick={() => onEdit(doc)}
            >
              <Pencil className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Xoá ${doc.title}`}
              onClick={() => onDelete(doc)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </li>
      ))}
    </ol>
  );
}
