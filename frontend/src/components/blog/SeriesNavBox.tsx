import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import type { SeriesNav } from '@/types/blog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Khối "chuỗi bài" ở cột phải: danh sách các kỳ, kỳ đang đọc được làm nổi. */
export function SeriesOutline({ nav, currentSlug }: { nav: SeriesNav; currentSlug: string }) {
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Layers className="size-4" />
        Chuỗi bài
      </p>
      <Link
        to={`/blog/chuoi/${encodeURIComponent(nav.name)}`}
        className="mb-2 block text-sm font-semibold hover:text-primary"
      >
        {nav.name}
        <span className="ml-1 font-normal text-muted-foreground">
          ({nav.current}/{nav.total})
        </span>
      </Link>
      <ol className="space-y-1 text-sm">
        {nav.items.map((item, index) => (
          <li key={item.id}>
            <Link
              to={`/blog/${item.slug}`}
              className={cn(
                'flex gap-2',
                item.slug === currentSlug
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground hover:text-primary',
              )}
            >
              <span className="shrink-0 tabular-nums">{item.seriesOrder ?? index + 1}.</span>
              <span className="min-w-0">{item.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Điều hướng kỳ trước / kỳ sau đặt cuối bài. */
export function SeriesPager({ nav }: { nav: SeriesNav }) {
  if (!nav.prev && !nav.next) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-6">
      {nav.prev ? (
        <Button variant="outline" asChild>
          <Link to={`/blog/${nav.prev.slug}`}>
            <ArrowLeft className="size-4" />
            <span className="max-w-[220px] truncate">{nav.prev.title}</span>
          </Link>
        </Button>
      ) : (
        <span />
      )}
      {nav.next && (
        <Button variant="outline" asChild>
          <Link to={`/blog/${nav.next.slug}`}>
            <span className="max-w-[220px] truncate">{nav.next.title}</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
