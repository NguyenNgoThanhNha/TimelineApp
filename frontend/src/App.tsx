import { useState } from 'react';
import { useTimelines } from './hooks/useTimelines';
import { Filters } from './components/Filters';
import { TimelineView } from './components/TimelineView';
import { TimelineForm } from './components/TimelineForm';
import { DetailModal } from './components/DetailModal';
import type { Timeline, TimelineFilters } from './types/timeline';

export default function App() {
  const [filters, setFilters] = useState<TimelineFilters>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Timeline | null>(null);
  const [detail, setDetail] = useState<Timeline | null>(null);

  const { data, isLoading, isError, error } = useTimelines(filters);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (t: Timeline) => {
    setEditing(t);
    setFormOpen(true);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="container header-inner">
          <div className="brand">
            <span className="brand-logo">🗓️</span>
            <div>
              <h1>Timeline cá nhân</h1>
              <p className="brand-sub">NestJS + Prisma + MongoDB · React + TypeScript</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            + Thêm timeline
          </button>
        </div>
      </header>

      <main className="container main-content">
        <Filters filters={filters} onChange={setFilters} />

        {isLoading && <div className="state-box">⏳ Đang tải dữ liệu…</div>}

        {isError && (
          <div className="state-box state-error">
            ❌ Không tải được dữ liệu: {(error as Error)?.message ?? 'Lỗi không xác định'}
          </div>
        )}

        {data && !isLoading && (
          <TimelineView items={data} onEdit={openEdit} onDetail={setDetail} />
        )}
      </main>

      {formOpen && <TimelineForm initial={editing} onClose={() => setFormOpen(false)} />}

      {detail && (
        <DetailModal
          timeline={detail}
          onClose={() => setDetail(null)}
          onEdit={(t) => {
            setDetail(null);
            openEdit(t);
          }}
        />
      )}
    </div>
  );
}
