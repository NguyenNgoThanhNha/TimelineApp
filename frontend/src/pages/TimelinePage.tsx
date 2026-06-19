import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import {
  useDeleteTimeline,
  useTimelines,
  useUpdateTimelineStatus,
} from '@/hooks/useTimelines';
import { Filters } from '@/components/Filters';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TimelineForm } from '@/components/TimelineForm';
import { DetailModal } from '@/components/DetailModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Timeline, TimelineFilters } from '@/types/timeline';

interface Props {
  formOpen: boolean;
  onFormOpenChange: (open: boolean) => void;
}

export function TimelinePage({ formOpen, onFormOpenChange }: Props) {
  const [filters, setFilters] = useState<TimelineFilters>({});
  const [editing, setEditing] = useState<Timeline | null>(null);
  const [detail, setDetail] = useState<Timeline | null>(null);

  const { data, isLoading, isError, error } = useTimelines(filters);
  const updateStatus = useUpdateTimelineStatus();
  const deleteTimeline = useDeleteTimeline();

  const openCreate = () => {
    setEditing(null);
    onFormOpenChange(true);
  };
  const openEdit = (t: Timeline) => {
    setEditing(t);
    onFormOpenChange(true);
  };

  const handleStatusChange = (id: string, status: Timeline['status']) => {
    const item = data?.find((t) => t.id === id);
    if (!item || item.status === status) return;
    updateStatus.mutate({ item, status });
  };

  const handleDelete = (item: Timeline) => {
    if (window.confirm(`Xoá timeline "${item.title}"?`)) {
      deleteTimeline.mutate(item.id);
    }
  };

  return (
    <>
      <Filters filters={filters} onChange={setFilters} hideStatus />

      {isLoading && (
        <Card className="glass-panel">
          <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            Đang tải dữ liệu…
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="glass-panel border-destructive/30 bg-destructive/5">
          <CardContent className="py-8 text-center text-destructive">
            {(error as Error)?.message ?? 'Lỗi không xác định'}
          </CardContent>
        </Card>
      )}

      {data && !isLoading && data.length === 0 && (
        <Card className="glass-panel">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Search className="size-10 text-muted-foreground/50" />
            <p className="font-medium">Chưa có timeline nào khớp</p>
            <p className="text-sm text-muted-foreground">Hãy thêm mốc mới hoặc đổi bộ lọc</p>
            <Button className="mt-2" variant="outline" onClick={openCreate}>
              <Plus className="size-4" /> Thêm mốc đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {data && data.length > 0 && (
        <KanbanBoard
          items={data}
          onStatusChange={handleStatusChange}
          onDetail={setDetail}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <TimelineForm
        open={formOpen}
        initial={editing}
        onClose={() => onFormOpenChange(false)}
      />

      <DetailModal
        open={!!detail}
        timeline={detail}
        onClose={() => setDetail(null)}
        onEdit={(t) => {
          setDetail(null);
          openEdit(t);
        }}
      />
    </>
  );
}
