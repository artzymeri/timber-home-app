'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, ShoppingCart, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { EmptyState } from '@/components/empty-state';
import { StageBadge } from '@/components/stage-badge';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { Stage } from '@/lib/stages';

interface OrderRow {
  id: number;
  client_name: string;
  address: string;
  total_amount?: number | string | null;
  created_at: string;
  stage_id: number;
  stage?: Stage;
}

const formatMoney = (n: number | string | null | undefined): string => {
  const v = typeof n === 'string' ? parseFloat(n) : n || 0;
  return v >= 1000 ? `€${(v / 1000).toFixed(1)}k` : `€${v.toFixed(0)}`;
};

export default function OfficeDashboard() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    api<{ orders: OrderRow[] }>('/api/orders')
      .then(({ orders }) => setOrders(orders))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  }, []);

  const active = orders?.filter((o) => o.stage && !o.stage.is_terminal).length ?? 0;
  const pending =
    orders?.filter((o) => o.stage && (o.stage.code === 'design_approval' || o.stage.code === 'estimate')).length ?? 0;
  const recent = (orders ?? [])
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const loading = orders === null;

  return (
    <PageContainer size="default">
      <div className="space-y-6">
        <PageHeader title={t('office_dashboard_title')} description={t('office_dashboard_subtitle')} />

        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            icon={ShoppingCart}
            label={t('office_active_orders')}
            value={loading ? '—' : active}
            loading={loading}
            href="/office/orders"
          />
          <MetricCard
            icon={ClipboardList}
            label={t('office_pending_approvals')}
            value={loading ? '—' : pending}
            loading={loading}
            tone={pending > 0 ? 'amber' : 'default'}
            href="/office/orders"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">{t('dashboard_recent_orders')}</CardTitle>
              <Link href="/office/orders" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <span>{t('dashboard_view_all')}</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
                <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
              </div>
            ) : recent.length === 0 ? (
              <div className="px-6 py-8">
                <EmptyState compact tone="info" title={t('dashboard_recent_orders_empty')} />
              </div>
            ) : (
              <div className="divide-y">
                {recent.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <span className="text-xs font-mono">#{o.id}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{o.client_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.address}</p>
                    </div>
                    {o.stage && <StageBadge stage={o.stage} />}
                    <span className="hidden sm:block text-sm font-semibold tabular-nums">
                      {o.total_amount != null ? formatMoney(o.total_amount) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
