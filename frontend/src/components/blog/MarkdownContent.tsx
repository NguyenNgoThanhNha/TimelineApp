import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';
import 'highlight.js/styles/github-dark.css';

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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
