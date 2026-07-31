import {
  BookOpen,
  Code2,
  ExternalLink,
  FileCode2,
  GraduationCap,
  Link2,
  PlayCircle,
  Trash2,
} from 'lucide-react';
import type { Resource, ResourceType } from '@/types/blog';
import { Button } from '@/components/ui/button';

const TYPE_META: Record<ResourceType, { label: string; icon: typeof Link2 }> = {
  Article: { label: 'Bài viết', icon: BookOpen },
  Video: { label: 'Video', icon: PlayCircle },
  Docs: { label: 'Tài liệu chính chủ', icon: FileCode2 },
  Repo: { label: 'Repository', icon: Code2 },
  Course: { label: 'Khoá học', icon: GraduationCap },
  Other: { label: 'Khác', icon: Link2 },
};

interface Props {
  resources: Resource[];
  onDelete?: (resource: Resource) => void;
}

/** Danh sách link tài nguyên ngoài đính kèm task hoặc bài viết. */
export function ResourceList({ resources, onDelete }: Props) {
  if (!resources.length) {
    return <p className="text-sm text-muted-foreground">Chưa có link tài nguyên nào.</p>;
  }

  return (
    <ul className="space-y-2">
      {resources.map((resource) => {
        const meta = TYPE_META[resource.type] ?? TYPE_META.Other;
        const Icon = meta.icon;

        return (
          <li
            key={resource.id}
            className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-3 transition-colors hover:border-border"
          >
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium hover:text-primary"
              >
                <span className="break-words">{resource.title}</span>
                <ExternalLink className="size-3.5 shrink-0 opacity-60" />
              </a>
              <p className="truncate text-xs text-muted-foreground">{resource.url}</p>
              {resource.note && (
                <p className="mt-1 text-sm text-muted-foreground">{resource.note}</p>
              )}
            </div>
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
              {meta.label}
            </span>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Xoá ${resource.title}`}
                onClick={() => onDelete(resource)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
