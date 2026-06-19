import { useStats } from '../hooks/useTimelines';
import { STATUS_META, STATUS_OPTIONS, categoryColor } from '../lib/constants';

function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color?: string;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ color }}>
        {icon}
      </div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}

function BarRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="bar-row">
      <div className="bar-label">{label}</div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="bar-value">{value}</div>
    </div>
  );
}

function Donut({ percent }: { percent: number }) {
  return (
    <div className="donut-wrap">
      <div
        className="donut"
        style={{ background: `conic-gradient(#22c55e ${percent * 3.6}deg, #e2e8f0 0deg)` }}
      >
        <div className="donut-hole">
          <span className="donut-num">{percent}%</span>
          <span className="donut-cap">hoàn thành</span>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading, isError, error } = useStats();

  if (isLoading) return <div className="state-box">⏳ Đang tải thống kê…</div>;
  if (isError)
    return <div className="state-box state-error">❌ {(error as Error)?.message}</div>;
  if (!stats) return null;

  const categories = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <h2 className="page-title">Dashboard thống kê</h2>

      <div className="kpi-grid">
        <KpiCard label="Tổng mốc" value={stats.total} icon="📌" color="#4f46e5" />
        <KpiCard label="Hoàn thành" value={stats.completed} icon="✅" color="#22c55e" />
        <KpiCard label="Sắp tới" value={stats.upcoming} icon="⏳" color="#f59e0b" />
        <KpiCard label="Quá hạn" value={stats.overdue} icon="⚠️" color="#ef4444" />
      </div>

      <div className="dash-grid">
        <div className="panel panel-donut">
          <h3>Tỉ lệ hoàn thành</h3>
          <Donut percent={stats.completionRate} />
        </div>

        <div className="panel">
          <h3>Theo trạng thái</h3>
          {STATUS_OPTIONS.map((o) => (
            <BarRow
              key={o.value}
              label={o.label}
              value={stats.byStatus[o.value] ?? 0}
              total={stats.total}
              color={STATUS_META[o.value].color}
            />
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Theo danh mục</h3>
        {categories.length === 0 && <p className="muted">Chưa có dữ liệu.</p>}
        {categories.map(([cat, count]) => (
          <BarRow key={cat} label={cat} value={count} total={stats.total} color={categoryColor(cat)} />
        ))}
      </div>
    </>
  );
}
