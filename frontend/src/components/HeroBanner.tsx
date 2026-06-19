import { Sparkles, Target, TrendingUp, Zap, type LucideIcon } from 'lucide-react';
import { useStats } from '@/hooks/useTimelines';
import type { View } from '@/components/Layout';
import type { AuthUser } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  user: AuthUser;
  view: View;
  onAddMilestone?: () => void;
}

const VIEW_COPY: Record<View, { title: string; subtitle: string }> = {
  timeline: {
    title: 'Bảng Kanban',
    subtitle: 'Kéo thả từng mốc — biến kế hoạch thành hành trình có đích',
  },
  dashboard: {
    title: 'Dashboard thống kê',
    subtitle: 'Theo dõi tiến độ, tỉ lệ hoàn thành và phân bổ theo danh mục',
  },
};

export function HeroBanner({ user, view, onAddMilestone }: Props) {
  const { data: stats } = useStats();
  const copy = VIEW_COPY[view];

  return (
    <section className="hero-banner relative mb-6 overflow-hidden rounded-2xl border border-white/20 shadow-xl shadow-indigo-500/10">
      <div className="hero-banner-bg" aria-hidden="true">
        <div className="hero-banner-aurora hero-banner-aurora--1" />
        <div className="hero-banner-aurora hero-banner-aurora--2" />
        <div className="hero-banner-grid" />
        <svg className="hero-banner-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 80 C360 20 720 100 1080 50 C1260 30 1380 40 1440 55 L1440 120 L0 120 Z"
            fill="hsl(var(--background) / 0.15)"
          />
          <path
            d="M0 95 C400 55 800 110 1200 70 C1320 58 1400 65 1440 72 L1440 120 L0 120 Z"
            fill="hsl(var(--background) / 0.25)"
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            Xin chào, {user.name}
            {user.role === 'Admin' && (
              <span className="rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
                Admin
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{copy.title}</h1>
          <p className="text-sm leading-relaxed text-white/75 sm:text-base">{copy.subtitle}</p>

          {view === 'timeline' && onAddMilestone && (
            <Button
              size="sm"
              className="mt-1 bg-white text-indigo-700 shadow-lg hover:bg-white/90"
              onClick={onAddMilestone}
            >
              <Zap className="size-4" />
              Thêm mốc mới
            </Button>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <StatPill icon={Target} label="Tổng mốc" value={stats.total} />
            <StatPill icon={TrendingUp} label="Hoàn thành" value={`${stats.completionRate}%`} accent />
            <StatPill
              icon={Zap}
              label="Sắp tới"
              value={stats.upcoming}
              warn={stats.overdue > 0}
              warnHint={`${stats.overdue} quá hạn`}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  accent,
  warn,
  warnHint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: boolean;
  warn?: boolean;
  warnHint?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-md sm:p-4',
        accent && 'bg-emerald-400/15 border-emerald-300/30',
        warn && 'bg-amber-400/10 border-amber-300/25',
      )}
    >
      <Icon className="mb-2 size-4 text-white/70" />
      <p className="text-xl font-bold tabular-nums text-white sm:text-2xl">{value}</p>
      <p className="text-[11px] font-medium text-white/60 sm:text-xs">{label}</p>
      {warn && warnHint && <p className="mt-0.5 text-[10px] text-amber-200/90">{warnHint}</p>}
    </div>
  );
}
