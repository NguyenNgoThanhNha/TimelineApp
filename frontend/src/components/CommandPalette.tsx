import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CornerDownLeft, FileText, ListChecks, Search } from 'lucide-react';
import { useSearch } from '@/hooks/useBlog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Hit {
  key: string;
  label: string;
  hint?: string | null;
  to: string;
  group: string;
  icon: typeof Search;
}

/**
 * Tìm kiếm nhanh toàn app (Ctrl/Cmd + K): bài viết, trang tài liệu và task.
 * Điều hướng bằng phím mũi tên, Enter để mở, Esc để đóng.
 */
export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);

  const { data, isFetching } = useSearch(term);

  // Ctrl/Cmd + K mở hộp tìm kiếm ở bất kỳ trang nào
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTerm('');
      setActive(0);
    }
  }, [open]);

  const hits: Hit[] = [
    ...(data?.posts ?? []).map((p) => ({
      key: `post-${p.id}`,
      label: p.title,
      hint: p.series ? `${p.series} · ${p.category}` : p.category,
      to: `/blog/${p.slug}`,
      group: 'Bài viết',
      icon: BookOpen,
    })),
    ...(data?.docs ?? []).map((d) => ({
      key: `doc-${d.id}`,
      label: d.title,
      hint: d.summary,
      to: `/tai-lieu/${d.slug}`,
      group: 'Tài liệu',
      icon: FileText,
    })),
    ...(data?.timelines ?? []).map((t) => ({
      key: `task-${t.id}`,
      label: t.title,
      hint: t.category,
      to: `/task/${t.id}`,
      group: 'Task',
      icon: ListChecks,
    })),
  ];

  const go = (hit?: Hit) => {
    if (!hit) return;
    setOpen(false);
    navigate(hit.to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(hits[active]);
    }
  };

  return (
    <>
      {/* Nút bấm trên header, kèm gợi ý phím tắt */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background/60 px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        <Search className="size-4" />
        <span className="hidden lg:inline">Tìm kiếm…</span>
        <kbd className="hidden rounded border border-border/70 px-1.5 text-[10px] font-medium lg:inline">
          Ctrl K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-24 max-h-[70vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Tìm kiếm</DialogTitle>
          </DialogHeader>

          {/* Chừa chỗ bên phải cho nút đóng của Dialog */}
          <div className="border-b border-border/60 p-3 pr-12">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Tìm bài viết, tài liệu, task…"
                className="border-0 pl-9 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto p-2">
            {term.trim().length < 2 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Gõ ít nhất 2 ký tự để tìm.
              </p>
            )}

            {term.trim().length >= 2 && !hits.length && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {isFetching ? 'Đang tìm…' : 'Không có kết quả nào khớp.'}
              </p>
            )}

            {hits.map((hit, index) => {
              const Icon = hit.icon;
              const isFirstOfGroup = index === 0 || hits[index - 1].group !== hit.group;

              return (
                <div key={hit.key}>
                  {isFirstOfGroup && (
                    <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {hit.group}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => go(hit)}
                    onMouseEnter={() => setActive(index)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm',
                      index === active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{hit.label}</span>
                      {hit.hint && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {hit.hint}
                        </span>
                      )}
                    </span>
                    {index === active && (
                      <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
