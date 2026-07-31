import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { Link2 } from 'lucide-react';
import { CodeBlock } from '@/components/blog/CodeBlock';
import { cn } from '@/lib/utils';
import 'highlight.js/styles/github-dark.css';

/** Link neo cạnh heading — bấm là nhảy tới mục và copy được URL có #anchor. */
function AnchorLink({ id }: { id?: string }) {
  if (!id) return null;
  return (
    <a href={`#${id}`} className="prose-doc-anchor" aria-label="Liên kết tới mục này">
      <Link2 className="size-4" />
    </a>
  );
}

interface Props {
  content: string;
  className?: string;
}

/**
 * Render nội dung Markdown của bài viết / tài liệu.
 *  - remark-gfm: bảng, checklist, gạch ngang
 *  - rehype-slug: gắn id cho heading để mục lục nhảy tới được
 *  - rehype-highlight: tô màu code block
 * Style nằm ở class `.prose-doc` trong index.css.
 */
export function MarkdownContent({ content, className }: Props) {
  return (
    <div className={cn('prose-doc', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          // Link ngoài mở tab mới cho an toàn
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              {...props}
            >
              {children}
            </a>
          ),
          // Bảng rộng thì cuộn ngang trong khung riêng, không đẩy vỡ trang
          table: ({ children, ...props }) => (
            <div className="prose-doc-table-wrap">
              <table {...props}>{children}</table>
            </div>
          ),
          // Code block kèm nút copy
          pre: ({ children, ...props }) => <CodeBlock {...props}>{children}</CodeBlock>,
          // Heading có link neo để copy đường dẫn tới đúng mục
          h2: ({ children, id, ...props }) => (
            <h2 id={id} {...props}>
              {children}
              <AnchorLink id={id} />
            </h2>
          ),
          h3: ({ children, id, ...props }) => (
            <h3 id={id} {...props}>
              {children}
              <AnchorLink id={id} />
            </h3>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
