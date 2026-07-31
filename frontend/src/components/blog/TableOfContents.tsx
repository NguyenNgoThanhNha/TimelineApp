import { useEffect, useMemo, useState } from 'react';
import GithubSlugger from 'github-slugger';
import { List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * Rút heading cấp 2-3 từ Markdown để dựng mục lục.
 * Dùng chung GithubSlugger với rehype-slug nên id luôn khớp với heading đã render.
 */
export function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  let insideCodeBlock = false;

  for (const line of markdown.split('\n')) {
    if (line.trimStart().startsWith('```')) {
      insideCodeBlock = !insideCodeBlock; // bỏ qua '## ' nằm trong code block
      continue;
    }
    if (insideCodeBlock) continue;

    const matched = /^(#{2,3})\s+(.*)$/.exec(line.trim());
    if (!matched) continue;

    // Bỏ ký tự Markdown trong tiêu đề: **đậm**, `code`, [link](url)
    const text = matched[2]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[*_`]/g, '')
      .trim();

    headings.push({ id: slugger.slug(text), text, level: matched[1].length });
  }

  return headings;
}

interface Props {
  content: string;
  className?: string;
}

export function TableOfContents({ content, className }: Props) {
  const headings = useMemo(() => extractHeadings(content), [content]);
  const [activeId, setActiveId] = useState<string>('');

  // Heading nào đang ở gần đầu màn hình thì sáng lên trong mục lục
  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: [0, 1] },
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav className={cn('text-sm', className)} aria-label="Mục lục">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <List className="size-4" />
        Mục lục
      </p>
      <ul className="space-y-1 border-l border-border/60">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                '-ml-px block border-l-2 py-1 pr-2 transition-colors',
                h.level === 3 ? 'pl-6' : 'pl-3',
                activeId === h.id
                  ? 'border-primary font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
