import { useMemo, type ReactNode } from 'react';
import { MarkdownContent } from '@/components/blog/MarkdownContent';
import { extractHeadings, TableOfContents } from '@/components/blog/TableOfContents';
import { Card } from '@/components/ui/card';

interface Props {
  /** Breadcrumb phía trên tiêu đề */
  breadcrumb?: ReactNode;
  /** Ảnh bìa (CoverArt hoặc img) */
  cover?: ReactNode;
  /** Badge chuyên mục / trạng thái nằm trên tiêu đề */
  eyebrow?: ReactNode;
  title: string;
  /** Dòng meta: tác giả, ngày, thời gian đọc */
  meta?: ReactNode;
  summary?: string | null;
  content: string;
  /** Khối hiển thị ngay dưới nội dung: thẻ, task liên quan, tài liệu… */
  footer?: ReactNode;
  /** Khối phụ trong cột phải, nằm dưới mục lục */
  sidebar?: ReactNode;
}

/**
 * Bố cục trang bài viết dài: cột nội dung + cột mục lục dính bên phải.
 * Dùng chung cho cả bài blog và trang tài liệu nội bộ để hai loại đọc giống nhau.
 */
export function ArticleLayout({
  breadcrumb,
  cover,
  eyebrow,
  title,
  meta,
  summary,
  content,
  footer,
  sidebar,
}: Props) {
  // Bài ngắn (dưới 2 heading) thì không dựng mục lục, tránh khối rỗng
  const hasToc = useMemo(() => extractHeadings(content).length >= 2, [content]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <article className="min-w-0">
        {breadcrumb && <div className="mb-4">{breadcrumb}</div>}

        <header className="mb-6">
          {eyebrow && <div className="mb-3 flex flex-wrap items-center gap-2">{eyebrow}</div>}
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{title}</h1>
          {meta && <div className="mt-3">{meta}</div>}
          {summary && (
            <p className="mt-4 border-l-2 border-primary/40 pl-4 text-base text-muted-foreground">
              {summary}
            </p>
          )}
        </header>

        {cover && (
          <div className="mb-8 h-48 overflow-hidden rounded-xl border border-border/60 sm:h-64">
            {cover}
          </div>
        )}

        {/* Mục lục bản mobile — nằm ngay trên nội dung vì không có cột phải */}
        {hasToc && (
          <Card className="glass-panel mb-6 p-4 lg:hidden">
            <TableOfContents content={content} />
          </Card>
        )}

        <MarkdownContent content={content} />

        {footer && <div className="mt-10 space-y-8">{footer}</div>}
      </article>

      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-6">
          <TableOfContents content={content} />
          {sidebar}
        </div>
      </aside>
    </div>
  );
}
