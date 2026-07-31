import { useEffect, useState } from 'react';

/** Thanh tiến độ đọc chạy dưới header, cho biết còn bao nhiêu phần bài chưa đọc. */
export function ReadingProgress() {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      setPercent(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-14 z-30 h-0.5 bg-transparent"
      role="progressbar"
      aria-label="Tiến độ đọc"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-primary transition-[width] duration-150"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
