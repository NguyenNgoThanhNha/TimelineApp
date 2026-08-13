import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { BookMarked, Brain, CalendarDays, Flame, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VocabularyNav } from '@/components/vocabulary/VocabularyNav';
import { useVocabularyHistory, useVocabularyStatistics } from '@/hooks/useVocabulary';
import { CEFR_COLOR, LEARNING_STATUS_META, LEARNING_STATUS_OPTIONS } from '@/lib/vocabulary-constants';
import { formatVnDate, toDateParam } from '@/lib/vocabulary-format';
import { cn } from '@/lib/utils';

/** Số đếm chạy dần khi vào trang — cùng hiệu ứng với Dashboard của Timeline. */
function useCountUp(value: number, duration = 600) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  index,
  accent,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  index: number;
  accent?: string;
}) {
  const display = useCountUp(value);

  return (
    <Card
      className="glass-panel animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className="flex size-10 items-center justify-center rounded-lg bg-muted"
          style={accent ? { backgroundColor: `${accent}20`, color: accent } : undefined}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{display}</p>
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
      className="grid grid-cols-[100px_1fr_36px] items-center gap-3 animate-in fade-in-0 duration-300 fill-mode-both"
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

export function VocabularyDashboardPage() {
  const { data: stats, isLoading } = useVocabularyStatistics();
  const { data: history } = useVocabularyHistory();

  if (isLoading || !stats) {
    return (
      <>
        <VocabularyNav />
        <Card className="glass-panel">
          <CardContent className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
            <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            Đang tải thống kê…
          </CardContent>
        </Card>
      </>
    );
  }

  const maxLearned = Math.max(1, ...(history ?? []).map((entry) => entry.learnedCount));
  const cefrEntries = Object.entries(stats.byCefr).filter(([, count]) => count > 0);

  return (
    <>
      <VocabularyNav />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tổng số từ" value={stats.total} icon={BookMarked} index={0} />
        <KpiCard
          label="Đã thuộc"
          value={stats.byStatus.Mastered}
          icon={GraduationCap}
          index={1}
          accent={LEARNING_STATUS_META.Mastered.color}
        />
        <KpiCard
          label="Đang học"
          value={stats.byStatus.Learning + stats.byStatus.Familiar}
          icon={Brain}
          index={2}
          accent={LEARNING_STATUS_META.Learning.color}
        />
        <KpiCard
          label="Mới học"
          value={stats.byStatus.New}
          icon={Sparkles}
          index={3}
          accent={LEARNING_STATUS_META.New.color}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Card className="glass-panel">
            <CardContent className="p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Flame className="size-4 text-orange-500" />
                Learning streak
              </p>
              <p className="text-3xl font-bold tabular-nums">
                {stats.streak}
                <span className="ml-1.5 text-base font-normal text-muted-foreground">
                  ngày liên tục
                </span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Một ngày được tính khi bạn học ít nhất 1 từ mới hoặc hoàn thành một lượt ôn.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="space-y-2 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hôm nay</span>
                <span className="font-semibold tabular-nums">{stats.today} từ</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">7 ngày qua</span>
                <span className="font-semibold tabular-nums">{stats.last7Days} từ</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tháng này</span>
                <span className="font-semibold tabular-nums">{stats.thisMonth} từ</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-2">
                <span className="text-muted-foreground">Đã ôn hôm nay</span>
                <span className="font-semibold tabular-nums">{stats.reviewedToday} lượt</span>
              </div>
            </CardContent>
          </Card>

          {stats.dueToday > 0 && (
            <Card className="glass-panel border-primary/30 bg-primary/5">
              <CardContent className="space-y-3 p-4">
                <p className="text-sm">
                  <span className="text-2xl font-bold tabular-nums">{stats.dueToday}</span>
                  <span className="ml-1.5 text-muted-foreground">từ tới hạn ôn hôm nay</span>
                </p>
                <Button className="w-full" asChild>
                  <Link to="/tu-vung/on-tap">
                    <GraduationCap className="size-4" />
                    Bắt đầu ôn
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Theo trạng thái học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {LEARNING_STATUS_OPTIONS.map((option, index) => (
                <BarRow
                  key={option.value}
                  label={option.label}
                  value={stats.byStatus[option.value] ?? 0}
                  total={stats.total}
                  color={LEARNING_STATUS_META[option.value].color}
                  index={index}
                />
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Theo trình độ CEFR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!cefrEntries.length && (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
              )}
              {cefrEntries.map(([level, count], index) => (
                <BarRow
                  key={level}
                  label={level === 'Unknown' ? 'Chưa xác định' : level}
                  value={count}
                  total={stats.total}
                  color={level === 'Unknown' ? '#94a3b8' : CEFR_COLOR[level as keyof typeof CEFR_COLOR]}
                  index={index}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" />
            30 ngày gần nhất
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!history?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Chưa có dữ liệu.</p>
          ) : (
            <div className="space-y-1">
              {history.map((entry) => {
                const key = toDateParam(entry.date);
                const pct = Math.round((entry.learnedCount / maxLearned) * 100);
                return (
                  <Link
                    key={key}
                    to={`/tu-vung/danh-sach?date=${key}`}
                    className={cn(
                      'grid grid-cols-[96px_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5',
                      'text-sm transition-colors hover:bg-accent',
                    )}
                  >
                    <span className="text-muted-foreground">{formatVnDate(entry.date)}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="whitespace-nowrap text-muted-foreground tabular-nums">
                      {entry.learnedCount} từ
                      {entry.reviewedCount > 0 && ` · ${entry.reviewedCount} ôn`}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
