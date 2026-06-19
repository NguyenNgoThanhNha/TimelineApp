import { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import type { Timeline, TimelineStatus } from '@/types/timeline';
import { STATUS_OPTIONS } from '@/lib/constants';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

interface Props {
  items: Timeline[];
  onStatusChange: (id: string, status: TimelineStatus) => void;
  onDetail: (item: Timeline) => void;
  onEdit: (item: Timeline) => void;
  onDelete: (item: Timeline) => void;
}

function groupByStatus(items: Timeline[]): Record<TimelineStatus, Timeline[]> {
  const map = Object.fromEntries(
    STATUS_OPTIONS.map((o) => [o.value, [] as Timeline[]]),
  ) as Record<TimelineStatus, Timeline[]>;

  for (const item of items) {
    map[item.status]?.push(item);
  }
  return map;
}

function resolveTargetStatus(overId: string | number | undefined): TimelineStatus | null {
  if (!overId) return null;
  const id = String(overId);
  if (STATUS_OPTIONS.some((o) => o.value === id)) return id as TimelineStatus;
  return null;
}

export function KanbanBoard({ items, onStatusChange, onDetail, onEdit, onDelete }: Props) {
  const grouped = useMemo(() => groupByStatus(items), [items]);
  const [activeItem, setActiveItem] = useState<Timeline | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find((t) => t.id === event.active.id);
    setActiveItem(item ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const item = items.find((t) => t.id === active.id);
    if (!item) return;

    let targetStatus = resolveTargetStatus(over.id);
    if (!targetStatus) {
      const overItem = items.find((t) => t.id === over.id);
      targetStatus = overItem?.status ?? null;
    }
    if (!targetStatus || targetStatus === item.status) return;

    onStatusChange(item.id, targetStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_OPTIONS.map((column) => (
          <KanbanColumn
            key={column.value}
            status={column.value}
            label={column.label}
            items={grouped[column.value]}
            onDetail={onDetail}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeItem ? (
          <KanbanCard item={activeItem} isOverlay onDetail={() => {}} onEdit={() => {}} onDelete={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
