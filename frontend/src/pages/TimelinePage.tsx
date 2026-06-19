import { useState } from 'react';
import { useTimelines } from '../hooks/useTimelines';
import { Filters } from '../components/Filters';
import { TimelineView } from '../components/TimelineView';
import { TimelineForm } from '../components/TimelineForm';
import { DetailModal } from '../components/DetailModal';
import type { Timeline, TimelineFilters } from '../types/timeline';

export function TimelinePage() {
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
    <>
      <div className="page-actions">
        <h2 className="page-title">Dòng thời gian</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + Thêm timeline
        </button>
      </div>

      <Filters filters={filters} onChange={setFilters} />

      {isLoading && <div className="state-box">⏳ Đang tải dữ liệu…</div>}

      {isError && (
        <div className="state-box state-error">
          ❌ {(error as Error)?.message ?? 'Lỗi không xác định'}
        </div>
      )}

      {data && !isLoading && (
        <TimelineView items={data} onEdit={openEdit} onDetail={setDetail} />
      )}

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
    </>
  );
}
