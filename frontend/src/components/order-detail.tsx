'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StageBadge } from '@/components/stage-badge';
import { EmptyState } from '@/components/empty-state';
import { OrderUploads } from '@/components/order-uploads';
import { OrderQrCard } from '@/components/order-qr-card';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { Stage } from '@/lib/stages';

interface OrderDetailData {
  id: number;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  address: string;
  notes?: string | null;
  total_amount?: number | string | null;
  stage_id: number;
  stage?: Stage;
}

interface BomItem {
  id: number;
  material_name: string;
  quantity: number | string;
  unit?: string | null;
  unit_cost: number | string;
  total_cost: number | string;
}

interface MeasurementRow {
  id: number;
  room_name: string;
  dimensions: string | { width?: number; height?: number; depth?: number };
  notes?: string | null;
  created_at: string;
}

const formatMoney = (n: number | string | null | undefined): string => {
  const v = typeof n === 'string' ? parseFloat(n) : n || 0;
  return `€${v.toFixed(2)}`;
};

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

interface OrderDetailProps {
  orderId: string | number;
  /** Override the inferred back link. By default the back chevron returns to
   *  `/<area>/orders` based on the current URL, keeping the user inside their
   *  layout area instead of bouncing to the admin route. */
  backHref?: string;
}

export function OrderDetail({ orderId, backHref }: OrderDetailProps) {
  const { t } = useI18n();
  const { hasCapability } = useAuth();
  const pathname = usePathname();
  const area = pathname.split('/').filter(Boolean)[0] || 'admin';
  const inferredBack = backHref ?? `/${area}/orders`;
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [bom, setBom] = useState<BomItem[] | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementRow[] | null>(null);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ order: OrderDetailData }>(`/api/orders/${orderId}`),
      api<{ items: BomItem[] }>(`/api/bom/${orderId}`).catch(() => ({ items: [] })),
      api<{ measurements: MeasurementRow[] }>(`/api/measurements/${orderId}`).catch(() => ({ measurements: [] })),
    ])
      .then(([o, b, m]) => {
        setOrder(o.order);
        setBom(b.items || []);
        setMeasurements(m.measurements || []);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  }, [orderId]);

  const advance = async () => {
    setAdvancing(true);
    try {
      const { order: next } = await api<{ order: OrderDetailData }>(`/api/orders/${orderId}/stage`, {
        method: 'PATCH',
      });
      setOrder(next);
      toast.success(t('stage_advance_done'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setAdvancing(false);
    }
  };

  const canEditDesigner = hasCapability('bom.manage');
  const canEditSales = hasCapability('quotes.create');
  const canAdvance = hasCapability('orders.advance_stage');

  if (!order) {
    return (
      <PageContainer size="wide">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  const isTerminal = order.stage?.is_terminal;
  const bomTotal = (bom || []).reduce((sum, i) => sum + (Number(i.total_cost) || 0), 0);

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        <PageHeader
          backHref={inferredBack}
          title={`${t('order')} #${order.id}`}
          description={`${order.client_name} · ${order.address}`}
          actions={
            <div className="flex items-center gap-2">
              {order.stage && <StageBadge stage={order.stage} size="md" />}
              {canAdvance && (
                <Button size="sm" onClick={advance} disabled={advancing || isTerminal}>
                  {advancing ? '…' : t('advance_stage')}
                </Button>
              )}
            </div>
          }
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('client_information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">{t('name')}:</span> {order.client_name}
              </p>
              <p>
                <span className="text-muted-foreground">{t('email')}:</span> {order.client_email ?? '—'}
              </p>
              <p>
                <span className="text-muted-foreground">{t('vehicle_type')}:</span> {order.client_phone ?? '—'}
              </p>
              <p>
                <span className="text-muted-foreground">{t('location')}:</span> {order.address}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('quotes')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('total')}</span>
                <span className="font-semibold tabular-nums">
                  {order.total_amount != null ? formatMoney(order.total_amount) : '—'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{order.notes ?? ''}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" size="sm" disabled>
                {t('generate_pdf')}
              </Button>
              <Button className="w-full" variant="outline" size="sm" disabled>
                {t('send_to_client')}
              </Button>
              <Button className="w-full" variant="outline" size="sm" disabled>
                {t('assign_worker')}
              </Button>
            </CardContent>
          </Card>

          <OrderQrCard orderId={order.id} />

          {/* Designer + Sales upload sections — visible to anyone with orders.read,
              edit gated by role-specific capability. */}
          <OrderUploads orderId={order.id} category="designer" canEdit={canEditDesigner} />
          <OrderUploads orderId={order.id} category="sales" canEdit={canEditSales} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('measurements_title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {measurements === null ? (
                <Skeleton className="h-20 w-full" />
              ) : measurements.length === 0 ? (
                <EmptyState compact tone="info" title={t('table_empty')} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">{t('room_name')}</th>
                        <th className="pb-2 font-medium">{t('width')}</th>
                        <th className="pb-2 font-medium">{t('height')}</th>
                        <th className="pb-2 font-medium">{t('depth')}</th>
                        <th className="pb-2 font-medium">{t('measurement_notes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((m) => {
                        const d = parseDims(m.dimensions);
                        return (
                          <tr key={m.id} className="border-b last:border-0">
                            <td className="py-2 font-medium">{m.room_name}</td>
                            <td className="py-2 tabular-nums">{d.width ?? '—'}</td>
                            <td className="py-2 tabular-nums">{d.height ?? '—'}</td>
                            <td className="py-2 tabular-nums">{d.depth ?? '—'}</td>
                            <td className="py-2 text-muted-foreground">{m.notes ?? ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('bom_title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {bom === null ? (
                <Skeleton className="h-20 w-full" />
              ) : bom.length === 0 ? (
                <EmptyState compact tone="info" title={t('bom_placeholder')} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">{t('material')}</th>
                        <th className="pb-2 font-medium">{t('quantity_label')}</th>
                        <th className="pb-2 font-medium">{t('unit_cost')}</th>
                        <th className="pb-2 font-medium">{t('total_cost')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bom.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-2 font-medium">{item.material_name}</td>
                          <td className="py-2 tabular-nums">
                            {item.quantity} {item.unit ?? ''}
                          </td>
                          <td className="py-2 tabular-nums">{formatMoney(item.unit_cost)}</td>
                          <td className="py-2 tabular-nums font-semibold">{formatMoney(item.total_cost)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={3} className="py-2 font-semibold text-right">
                          {t('total')}:
                        </td>
                        <td className="py-2 font-bold tabular-nums">{formatMoney(bomTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
