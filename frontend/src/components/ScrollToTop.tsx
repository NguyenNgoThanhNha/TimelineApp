import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Đổi route thì cuộn lên đầu trang — trừ khi link có anchor (#muc-luc). */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}
