import { useRef, useState, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

/** Code block có nút copy — thay thẻ <pre> mặc định khi render Markdown. */
export function CodeBlock({ children, ...props }: Props) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = ref.current?.innerText ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt chặn clipboard (thường do không chạy HTTPS) -> bỏ qua, người dùng bôi đen copy tay
    }
  };

  return (
    <div className="prose-doc-code group relative">
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Đã copy' : 'Copy đoạn code'}
        className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs text-white/80 opacity-0 transition-opacity hover:bg-white/20 focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? 'Đã copy' : 'Copy'}
      </button>
      <pre ref={ref} {...props}>
        {children}
      </pre>
    </div>
  );
}
