import { cn } from '@/lib/utils';

// Bài viết chưa có ảnh bìa thì dùng gradient sinh theo tên — vẫn nhận diện được bài,
// không cần upload ảnh. `coverImage` dạng "gradient:violet" cũng render bằng bảng này.
const GRADIENTS: Record<string, string> = {
  violet: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #a78bfa 100%)',
  teal: 'linear-gradient(135deg, #134e4a 0%, #0d9488 55%, #5eead4 100%)',
  amber: 'linear-gradient(135deg, #78350f 0%, #d97706 55%, #fcd34d 100%)',
  rose: 'linear-gradient(135deg, #881337 0%, #e11d48 55%, #fda4af 100%)',
  sky: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 55%, #7dd3fc 100%)',
  indigo: 'linear-gradient(135deg, #312e81 0%, #4f46e5 55%, #a5b4fc 100%)',
};

const KEYS = Object.keys(GRADIENTS);

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[KEYS[Math.abs(hash) % KEYS.length]];
}

interface Props {
  coverImage?: string | null;
  seed: string;
  label?: string;
  className?: string;
}

export function CoverArt({ coverImage, seed, label, className }: Props) {
  const isUrl = !!coverImage && !coverImage.startsWith('gradient:');
  const gradientKey = coverImage?.startsWith('gradient:') ? coverImage.slice('gradient:'.length) : null;
  const background = gradientKey ? GRADIENTS[gradientKey] ?? gradientFor(seed) : gradientFor(seed);

  if (isUrl) {
    return (
      <img
        src={coverImage!}
        alt={label ?? ''}
        loading="lazy"
        className={cn('h-full w-full object-cover', className)}
      />
    );
  }

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)} style={{ background }}>
      {/* Lưới mờ tạo chiều sâu cho ảnh bìa sinh tự động */}
      <div className="cover-art-grid absolute inset-0" />
      {label && (
        <span className="absolute bottom-3 left-4 max-w-[85%] truncate text-sm font-semibold text-white/90 drop-shadow">
          {label}
        </span>
      )}
    </div>
  );
}
