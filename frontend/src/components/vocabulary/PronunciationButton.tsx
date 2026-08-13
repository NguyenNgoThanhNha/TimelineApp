import { useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PronunciationAccent } from '@/types/vocabulary';

const ACCENT_META: Record<PronunciationAccent, { flag: string; label: string; lang: string }> = {
  UK: { flag: '🇬🇧', label: 'UK', lang: 'en-GB' },
  US: { flag: '🇺🇸', label: 'US', lang: 'en-US' },
  Other: { flag: '🌐', label: 'Khác', lang: 'en' },
};

interface Props {
  word: string;
  accent: PronunciationAccent;
  ipa?: string | null;
  audioUrl?: string | null;
  /** compact = chỉ hiện nút loa, dùng trong card danh sách */
  compact?: boolean;
  className?: string;
}

/**
 * Nghe phát âm: ưu tiên file audio của dictionary API, không có thì
 * fallback sang Text-to-Speech của trình duyệt với đúng giọng UK/US.
 */
export function PronunciationButton({ word, accent, ipa, audioUrl, compact, className }: Props) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const meta = ACCENT_META[accent];

  const speak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = meta.lang;
    utterance.rate = 0.9;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const play = () => {
    setPlaying(true);

    if (!audioUrl) {
      speak();
      return;
    }

    audioRef.current ??= new Audio(audioUrl);
    const audio = audioRef.current;
    audio.currentTime = 0;
    audio.onended = () => setPlaying(false);
    // File audio hỏng / chặn CORS -> vẫn nghe được nhờ Text-to-Speech
    audio.play().catch(speak);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={play}
        title={`Nghe phát âm ${meta.label}`}
        className={cn(
          'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
          playing && 'text-primary',
          className,
        )}
      >
        <Volume2 className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={play}
      title={`Nghe phát âm ${meta.label}`}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-sm transition-colors hover:bg-accent',
        playing && 'border-primary/50 text-primary',
        className,
      )}
    >
      <span aria-hidden>{meta.flag}</span>
      <span className="font-medium text-muted-foreground">{meta.label}</span>
      {ipa && <span className="font-mono">{ipa}</span>}
      <Volume2 className="size-4" />
    </button>
  );
}
