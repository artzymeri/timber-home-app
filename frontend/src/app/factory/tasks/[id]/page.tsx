'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StageBadge } from '@/components/stage-badge';
import { EmptyState } from '@/components/empty-state';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { Stage } from '@/lib/stages';

interface TaskOrder {
  id: number;
  client_name: string;
  address: string;
  notes?: string | null;
  stage_id: number;
  stage?: Stage;
}

interface BomItem {
  id: number;
  material_name: string;
  quantity: number | string;
  unit?: string | null;
}

interface MeasurementRow {
  id: number;
  room_name: string;
  dimensions: string | { width?: number; height?: number; depth?: number };
  notes?: string | null;
}

const parseDims = (raw: MeasurementRow['dimensions']): { width?: number; height?: number; depth?: number } => {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw ?? {};
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [order, setOrder] = useState<TaskOrder | null>(null);
  const [bom, setBom] = useState<BomItem[] | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementRow[] | null>(null);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ order: TaskOrder }>(`/api/orders/${id}`),
      api<{ items: BomItem[] }>(`/api/bom/${id}`).catch(() => ({ items: [] })),
      api<{ measurements: MeasurementRow[] }>(`/api/measurements/${id}`).catch(() => ({ measurements: [] })),
    ])
      .then(([o, b, m]) => {
        setOrder(o.order);
        setBom(b.items || []);
        setMeasurements(m.measurements || []);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  }, [id]);

  const advance = async () => {
    setAdvancing(true);
    try {
      const { order: next, advanced_to } = await api<{ order: TaskOrder; advanced_to?: string }>(
        `/api/orders/${id}/stage`,
        { method: 'PATCH' }
      );
      setOrder(next);
      toast.success(
        advanced_to ? t('factory_advanced_to').replace('{stage}', advanced_to) : t('stage_advance_done')
      );
      router.push('/factory/tasks');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setAdvancing(false);
    }
  };

  if (!order) {
    return (
      <PageContainer size="default">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </PageContainer>
    );
  }

  const isTerminal = order.stage?.is_terminal;

  return (
    <PageContainer size="default">
      <div className="space-y-5">
        <PageHeader
          backHref="/factory/tasks"
          title={`${t('order')} #${order.id}`}
          description={`${order.client_name} · ${order.address}`}
          actions={order.stage && <StageBadge stage={order.stage} size="md" />}
        />

        <Card>
          <CardContent className="pt-5 space-y-4">
            {order.notes && (
              <div>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{t('measurements_title')}</h3>
              {measurements === null ? (
                <Skeleton className="h-16 w-full" />
              ) : measurements.length === 0 ? (
                <EmptyState compact tone="info" title={t('table_empty')} />
              ) : (
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {measurements.map((m) => {
                    const d = parseDims(m.dimensions);
                    return (
                      <li key={m.id}>
                        • {m.room_name}: {d.width ?? '?'}mm × {d.height ?? '?'}mm × {d.depth ?? '?'}mm
                        {m.notes ? ` — ${m.notes}` : ''}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{t('bom_title')}</h3>
              {bom === null ? (
                <Skeleton className="h-16 w-full" />
              ) : bom.length === 0 ? (
                <EmptyState compact tone="info" title={t('bom_placeholder')} />
              ) : (
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {bom.map((b) => (
                    <li key={b.id}>
                      • {b.material_name} — {b.quantity} {b.unit ?? ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full h-14 text-lg font-bold"
          onClick={advance}
          disabled={advancing || !!isTerminal}
        >
          {advancing ? '…' : t('factory_advance')}
        </Button>
      </div>
    </PageContainer>
  );
}
