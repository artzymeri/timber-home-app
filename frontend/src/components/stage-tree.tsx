'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { resolveIcon } from '@/lib/icon-resolver';
import { colorClasses, stageDisplayName, type StageNode } from '@/lib/stages';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StageTreeProps {
  tree: StageNode[];
  onChange?: (next: StageNode[]) => void;
}

interface RowProps {
  node: StageNode;
  depth: number;
}

function Row({ node, depth }: RowProps) {
  const router = useRouter();
  const { t } = useI18n();
  const Icon = resolveIcon(node.icon);
  const c = colorClasses(node.color);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-md border bg-card px-3 py-2',
        c.border
      )}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>
      <div style={{ width: depth * 18 }} className="shrink-0" />
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', c.bg, c.text)}>
        <Icon size={14} />
      </div>
      <button
        type="button"
        onClick={() => router.push(`/admin/stages/${node.id}`)}
        className="flex-1 text-left min-w-0"
      >
        <p className="text-sm font-medium truncate">{stageDisplayName(node, t)}</p>
        {node.description && (
          <p className="text-xs text-muted-foreground truncate">{node.description}</p>
        )}
      </button>
      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
        {node.is_initial && (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px]">
            {t('stage_is_initial')}
          </Badge>
        )}
        {node.is_terminal && (
          <Badge variant="secondary" className="bg-stone-200 text-stone-700 text-[10px]">
            {t('stage_is_terminal')}
          </Badge>
        )}
        {node.is_system && (
          <Badge variant="secondary" className="text-[10px]">{t('roles_system_badge')}</Badge>
        )}
        {(node.order_count ?? 0) > 0 && (
          <span>{node.order_count}</span>
        )}
      </div>
    </div>
  );
}

interface SiblingGroupProps {
  parentId: number | null;
  children: StageNode[];
  depth: number;
  onReorder: (parentId: number | null, ordered: StageNode[]) => void;
}

function SiblingGroup({ parentId, children, depth, onReorder }: SiblingGroupProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = useMemo(() => children.map((c) => c.id), [children]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = children.findIndex((c) => c.id === active.id);
    const newIndex = children.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(children, oldIndex, newIndex);
    onReorder(parentId, next);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {children.map((node) => (
            <div key={node.id}>
              <Row node={node} depth={depth} />
              {node.children.length > 0 && (
                <div className="ml-6 mt-2">
                  <SiblingGroup
                    parentId={node.id}
                    children={node.children}
                    depth={depth + 1}
                    onReorder={onReorder}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function StageTree({ tree, onChange }: StageTreeProps) {
  const [working, setWorking] = useState(tree);

  const persistOrder = async (parentId: number | null, ordered: StageNode[]) => {
    // Optimistic update
    const update = (nodes: StageNode[]): StageNode[] =>
      nodes.map((n) => {
        if ((n.parent_id ?? null) === parentId && (n.children.length || ordered.some((o) => o.id === n.id))) {
          // sibling group at this parent — replace order
        }
        return { ...n, children: update(n.children) };
      });
    // Simpler: rebuild with replaced sibling group at the matching parent
    const replaceGroup = (nodes: StageNode[]): StageNode[] => {
      // top-level
      if (parentId === null) {
        return ordered.map((o, i) => ({ ...o, sort_order: (i + 1) * 10 }));
      }
      return nodes.map((n) => {
        if (n.id === parentId) {
          return {
            ...n,
            children: ordered.map((o, i) => ({ ...o, sort_order: (i + 1) * 10 })),
          };
        }
        return { ...n, children: replaceGroup(n.children) };
      });
    };
    const next = replaceGroup(working);
    setWorking(next);
    onChange?.(next);

    try {
      await api('/api/stages/reorder', {
        method: 'POST',
        body: JSON.stringify({ parent_id: parentId, ordered_ids: ordered.map((o) => o.id) }),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reorder failed');
    }
  };

  return <SiblingGroup parentId={null} children={working} depth={0} onReorder={persistOrder} />;
}
