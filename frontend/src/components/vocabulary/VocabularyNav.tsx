import { NavLink } from 'react-router-dom';
import { BarChart3, GraduationCap, ListChecks, Sparkles } from 'lucide-react';
import { useVocabularyStatistics } from '@/hooks/useVocabulary';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/tu-vung', label: 'Hôm nay', icon: Sparkles, end: true },
  { to: '/tu-vung/danh-sach', label: 'Danh sách', icon: ListChecks, end: false },
  { to: '/tu-vung/thong-ke', label: 'Thống kê', icon: BarChart3, end: false },
  { to: '/tu-vung/on-tap', label: 'Ôn tập', icon: GraduationCap, end: false, showDue: true },
];

/** Thanh chuyển nhanh giữa các màn từ vựng, kèm badge số từ tới hạn ôn. */
export function VocabularyNav() {
  const { data: stats } = useVocabularyStatistics();
  const due = stats?.dueToday ?? 0;

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1 rounded-lg border border-border/50 bg-background/50 p-1 backdrop-blur-sm">
      {TABS.map(({ to, label, icon: Icon, end, showDue }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-card/90 text-foreground shadow-sm backdrop-blur-sm'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
            )
          }
        >
          <Icon className="size-4" />
          {label}
          {showDue && due > 0 && (
            <span className="ml-0.5 rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums">
              {due}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
