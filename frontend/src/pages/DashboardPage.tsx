import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Clock, Pin } from 'lucide-react';
import { useStats } from '@/hooks/useTimelines';
import { STATUS_META, STATUS_OPTIONS, categoryColor } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function KpiCard({
  label,
  value,
  icon: Icon,
  className,
  index,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  className?: string;
  index: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 600;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <Card
      className={cn('animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both', className)}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{displayValue}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BarRow({
  label,
  value,
  total,
  color,
  index,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  index: number;
}) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div
      className="grid grid-cols-[120px_1fr_36px] items-center gap-3 animate-in fade-in-0 duration-300 fill-mode-both"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <span className="truncate text-sm">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-right text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Donut({ percent }: { percent: number }) {
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPercent(Math.round(eased * percent));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  return (
    <div className="flex justify-center py-4">
      <div
        className="relative flex size-36 items-center justify-center rounded-full transition-[background] duration-100"
        style={{
          background: `conic-gradient(hsl(var(--chart-2)) ${displayPercent * 3.6}deg, hsl(var(--muted)) 0deg)`,
        }}
      >
        <div className="flex size-28 flex-col items-center justify-center rounded-full bg-card">
          <span className="text-3xl font-bold tabular-nums">{displayPercent}%</span>
          <span className="text-xs text-muted-foreground">hoàn thành</span>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading, isError, error } = useStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
        <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
        Đang tải thống kê…
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-8 text-center text-destructive">
          {(error as Error)?.message}
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const categories = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard thống kê</h2>
        <p className="text-sm text-muted-foreground">Tổng quan tiến độ timeline của bạn</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tổng mốc" value={stats.total} icon={Pin} index={0} />
        <KpiCard label="Hoàn thành" value={stats.completed} icon={CheckCircle2} index={1} />
        <KpiCard label="Sắp tới" value={stats.upcoming} icon={Clock} index={2} />
        <KpiCard label="Quá hạn" value={stats.overdue} icon={AlertTriangle} index={3} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="text-base">Tỉ lệ hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <Donut percent={stats.completionRate} />
          </CardContent>
        </Card>

        <Card className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both" style={{ animationDelay: '280ms' }}>
          <CardHeader>
            <CardTitle className="text-base">Theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {STATUS_OPTIONS.map((o, i) => (
              <BarRow
                key={o.value}
                label={o.label}
                value={stats.byStatus[o.value] ?? 0}
                total={stats.total}
                color={STATUS_META[o.value].color}
                index={i}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both" style={{ animationDelay: '360ms' }}>
        <CardHeader>
          <CardTitle className="text-base">Theo danh mục</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>}
          {categories.map(([cat, count], i) => (
            <BarRow
              key={cat}
              label={cat}
              value={count}
              total={stats.total}
              color={categoryColor(cat)}
              index={i}
            />
          ))}
        </CardContent>
      </Card>
    </>
  );
}
