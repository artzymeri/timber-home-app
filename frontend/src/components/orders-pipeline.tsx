'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Filter,
  LayoutGrid,
  Plus,
  ShoppingCart,
  Table as TableIcon,
  Columns3,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PageContainer } from '@/components/page-container';
import { EmptyState } from '@/components/empty-state';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { resolveIcon } from '@/lib/icon-resolver';
import {
  colorClasses,
  flattenLeaves,
  stageDisplayName,
  type Stage,
  type StageColor,
  type StageNode,
} from '@/lib/stages';
import { cn } from '@/lib/utils';

interface OrderRow {
  id: number;
  client_name: string;
  address: string;
  total_amount?: number | string | null;
  created_at: string;
  notes?: string | null;
  stage_id: number;
  stage?: Stage;
}

const initialOrderForm = {
  client_name: '',
  client_email: '',
  client_phone: '',
  address: '',
  notes: '',
};

type ViewMode = 'lanes' | 'focus' | 'table';

const formatMoney = (n: number | string | null | undefined): string => {
  const v = typeof n === 'string' ? parseFloat(n) : n || 0;
  if (v >= 1000) return `€${(v / 1000).toFixed(1)}k`;
  return `€${v.toFixed(0)}`;
};

const COLOR_BAR: Record<StageColor, string> = {
  stone: 'bg-stone-400 dark:bg-stone-500',
  amber: 'bg-amber-400 dark:bg-amber-500',
  blue: 'bg-blue-400 dark:bg-blue-500',
  emerald: 'bg-emerald-400 dark:bg-emerald-500',
  violet: 'bg-violet-400 dark:bg-violet-500',
  rose: 'bg-rose-400 dark:bg-rose-500',
};

const formatDate = (iso?: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

interface OrderCardProps {
  order: OrderRow;
  href: string;
}

function OrderCard({ order, href }: OrderCardProps) {
  const stage = order.stage;
  const cc = stage ? colorClasses(stage.color) : null;
  const Icon = stage ? resolveIcon(stage.icon) : null;
  const due = formatDate(order.created_at);

  return (
    <Link
      href={href}
      className="group block rounded-md border bg-card p-3 transition-colors hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-mono text-muted-foreground">#{order.id}</span>
        <span className="text-sm font-semibold tabular-nums">
          {order.total_amount != null ? formatMoney(order.total_amount) : '—'}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold leading-tight truncate">{order.client_name}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground truncate flex-1">{order.address}</p>
        {due && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Calendar size={11} />
            {due}
          </span>
        )}
      </div>
      {stage && Icon && cc && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium', cc.chip)}>
            <Icon size={11} />
            {stageDisplayName(stage, (k) => k as string)}
          </span>
        </div>
      )}
    </Link>
  );
}

interface OrdersPipelineProps {
  /** Base path for order detail links — e.g. "/admin/orders" or "/office/orders". */
  basePath: string;
}

export function OrdersPipeline({ basePath }: OrdersPipelineProps) {
  const { t } = useI18n();
  const { hasCapability } = useAuth();
  const canCreate = hasCapability('orders.create');
  const [stages, setStages] = useState<StageNode[] | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [view, setView] = useState<ViewMode>('lanes');
  const [focusStageId, setFocusStageId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(initialOrderForm);

  // The sidebar's "+" trailing action navigates to ?create=1; pop the sheet
  // when we land on the page with that param, then strip it so a refresh
  // doesn't keep re-opening the sheet.
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true);
      router.replace(basePath);
    }
  }, [searchParams, router, basePath]);

  const load = () => {
    Promise.all([
      api<{ tree: StageNode[] }>('/api/stages'),
      api<{ orders: OrderRow[] }>('/api/orders'),
    ])
      .then(([s, o]) => {
        setStages(s.tree);
        setOrders(o.orders);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          client_name: form.client_name.trim(),
          client_email: form.client_email.trim() || null,
          client_phone: form.client_phone.trim() || null,
          address: form.address.trim(),
          notes: form.notes.trim() || null,
        }),
      });
      toast.success(t('order_created'));
      setCreateOpen(false);
      setForm(initialOrderForm);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setCreating(false);
    }
  };

  const lanes = useMemo(() => (stages ? flattenLeaves(stages) : []), [stages]);
  const ordersByStage = useMemo(() => {
    const m = new Map<number, OrderRow[]>();
    if (!orders) return m;
    for (const o of orders) {
      const list = m.get(o.stage_id) || [];
      list.push(o);
      m.set(o.stage_id, list);
    }
    return m;
  }, [orders]);

  const stageTotals = useMemo(() => {
    const m = new Map<number, { count: number; total: number }>();
    if (!orders) return m;
    for (const o of orders) {
      const cur = m.get(o.stage_id) || { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(o.total_amount) || 0;
      m.set(o.stage_id, cur);
    }
    return m;
  }, [orders]);

  const totals = useMemo(() => {
    if (!orders || !stages) return { active: 0, value: 0, stageCount: 0 };
    const active = orders.filter((o) => o.stage && !o.stage.is_terminal).length;
    const value = orders
      .filter((o) => o.stage && !o.stage.is_terminal)
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    return { active, value, stageCount: lanes.length };
  }, [orders, stages, lanes.length]);

  useEffect(() => {
    if (focusStageId == null && lanes.length > 0) {
      const firstWithOrders = lanes.find((s) => (ordersByStage.get(s.id)?.length ?? 0) > 0);
      setFocusStageId(firstWithOrders?.id ?? lanes[0].id);
    }
  }, [lanes, ordersByStage, focusStageId]);

  const loading = !stages || !orders;

  const focusColumns = useMemo(() => {
    if (focusStageId == null) return [];
    const idx = lanes.findIndex((s) => s.id === focusStageId);
    if (idx < 0) return [];
    return [lanes[idx - 1], lanes[idx], lanes[idx + 1]].filter(Boolean) as StageNode[];
  }, [focusStageId, lanes]);

  const orderHref = (id: number) => `${basePath}/${id}`;

  return (
    <PageContainer size="wide">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('orders')}{' '}
              <span className="text-emerald-600 dark:text-emerald-400">
                {t('orders_pipeline_word')}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('orders_pipeline_summary')
                .replace('{active}', String(totals.active))
                .replace('{stages}', String(totals.stageCount))
                .replace('{value}', formatMoney(totals.value))}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-md border bg-card p-0.5">
              {(
                [
                  { value: 'lanes' as const, icon: LayoutGrid, label: t('orders_view_lanes') },
                  { value: 'focus' as const, icon: Columns3, label: t('orders_view_focus') },
                  { value: 'table' as const, icon: TableIcon, label: t('orders_view_table') },
                ]
              ).map((opt) => {
                const Icon = opt.icon;
                const active = view === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setView(opt.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'bg-brand text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon size={13} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <Button variant="outline" size="sm">
              <Filter size={14} />
              <span>{t('table_filters')}</span>
            </Button>
            {canCreate && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={14} />
                <span>{t('orders_new')}</span>
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : orders!.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title={t('no_orders')}
            action={
              canCreate ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus size={14} />
                  <span>{t('orders_new')}</span>
                </Button>
              ) : undefined
            }
          />
        ) : view === 'lanes' ? (
          <LanesView
            lanes={lanes}
            ordersByStage={ordersByStage}
            stageTotals={stageTotals}
            onCreate={canCreate ? () => setCreateOpen(true) : undefined}
            orderHref={orderHref}
          />
        ) : view === 'focus' ? (
          <FocusView
            lanes={lanes}
            ordersByStage={ordersByStage}
            stageTotals={stageTotals}
            focusStageId={focusStageId}
            onSelect={setFocusStageId}
            focusColumns={focusColumns}
            orderHref={orderHref}
          />
        ) : (
          <TableView orders={orders!} orderHref={orderHref} />
        )}
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle>{t('order_add_title')}</SheetTitle>
            <SheetDescription>{t('order_add_subtitle')}</SheetDescription>
          </SheetHeader>
          <form onSubmit={submit} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-4">
              <div className="space-y-2">
                <Label htmlFor="op-client-name">{t('order_client_name')}</Label>
                <Input
                  id="op-client-name"
                  value={form.client_name}
                  onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                  required
                  maxLength={150}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="op-client-email">{t('order_client_email')}</Label>
                  <Input
                    id="op-client-email"
                    type="email"
                    value={form.client_email}
                    onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="op-client-phone">{t('order_client_phone')}</Label>
                  <Input
                    id="op-client-phone"
                    value={form.client_phone}
                    onChange={(e) => setForm((f) => ({ ...f, client_phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="op-order-address">{t('order_address')}</Label>
                <Input
                  id="op-order-address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="op-order-notes">{t('order_notes')}</Label>
                <Textarea
                  id="op-order-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <SheetFooter className="flex-row justify-end border-t">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? '…' : t('order_save')}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}

interface ViewProps {
  lanes: StageNode[];
  ordersByStage: Map<number, OrderRow[]>;
  stageTotals: Map<number, { count: number; total: number }>;
  orderHref: (id: number) => string;
}

function LaneHeader({
  stage,
  count,
  total,
  onCreate,
  compact,
}: {
  stage: StageNode;
  count: number;
  total: number;
  onCreate?: () => void;
  compact?: boolean;
}) {
  const Icon = resolveIcon(stage.icon);
  const cc = colorClasses(stage.color);
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border bg-card pr-3 overflow-hidden',
        compact ? 'py-1.5 pl-2' : 'py-2 pl-2'
      )}
    >
      <span className={cn('h-5 w-1 shrink-0 rounded-full', COLOR_BAR[stage.color])} />
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', cc.chip)}>
        <Icon size={13} />
      </div>
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <span className="text-sm font-semibold truncate">{stage.name}</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground tabular-nums">
          {count}
        </span>
      </div>
      <span className="text-sm font-semibold tabular-nums">{formatMoney(total)}</span>
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Add order"
        >
          <Plus size={13} />
        </button>
      )}
    </div>
  );
}

function LanesView({
  lanes,
  ordersByStage,
  stageTotals,
  onCreate,
  orderHref,
}: ViewProps & { onCreate?: () => void }) {
  return (
    <div className="space-y-3">
      {lanes.map((stage) => {
        const stageOrders = ordersByStage.get(stage.id) || [];
        const totals = stageTotals.get(stage.id) || { count: 0, total: 0 };
        return (
          <div key={stage.id} className="space-y-2">
            <LaneHeader
              stage={stage}
              count={totals.count}
              total={totals.total}
              onCreate={onCreate}
            />
            {stageOrders.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {stageOrders.map((order) => (
                  <OrderCard key={order.id} order={order} href={orderHref(order.id)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FocusView({
  lanes,
  ordersByStage,
  stageTotals,
  focusStageId,
  onSelect,
  focusColumns,
  orderHref,
}: ViewProps & {
  focusStageId: number | null;
  onSelect: (id: number) => void;
  focusColumns: StageNode[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card>
        <CardContent className="p-2">
          <div className="space-y-1">
            {lanes.map((stage) => {
              const Icon = resolveIcon(stage.icon);
              const cc = colorClasses(stage.color);
              const totals = stageTotals.get(stage.id) || { count: 0, total: 0 };
              const active = stage.id === focusStageId;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => onSelect(stage.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors',
                    active ? 'bg-accent' : 'hover:bg-accent/40'
                  )}
                >
                  <span className={cn('h-7 w-1 shrink-0 rounded-full', COLOR_BAR[stage.color])} />
                  <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', cc.chip)}>
                    <Icon size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">{stage.name}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {totals.count} · {formatMoney(totals.total)}
                    </p>
                  </div>
                  {active && <ArrowRight size={12} className="text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {focusColumns.map((stage) => {
          const stageOrders = ordersByStage.get(stage.id) || [];
          const totals = stageTotals.get(stage.id) || { count: 0, total: 0 };
          return (
            <div key={stage.id} className="flex flex-col gap-2">
              <LaneHeader stage={stage} count={totals.count} total={totals.total} compact />
              <div className="space-y-2">
                {stageOrders.map((order) => (
                  <OrderCard key={order.id} order={order} href={orderHref(order.id)} />
                ))}
                {stageOrders.length === 0 && (
                  <p className="rounded-md border border-dashed bg-card/50 px-3 py-6 text-center text-xs text-muted-foreground">
                    —
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TableView({ orders, orderHref }: { orders: OrderRow[]; orderHref: (id: number) => string }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="border-b">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">#</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">CLIENT</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">ADDRESS</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">STAGE</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">DUE</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0 transition-colors hover:bg-accent/30">
                <td className="px-3 py-3 font-mono text-xs text-muted-foreground">#{o.id}</td>
                <td className="px-3 py-3 font-semibold">
                  <Link href={orderHref(o.id)} className="hover:underline">
                    {o.client_name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{o.address}</td>
                <td className="px-3 py-3">
                  {o.stage ? (
                    <Badge
                      variant="secondary"
                      className={cn('inline-flex items-center gap-1', colorClasses(o.stage.color).chip)}
                    >
                      {(() => {
                        const Icon = resolveIcon(o.stage.icon);
                        return <Icon size={11} />;
                      })()}
                      {o.stage.name}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-3 text-muted-foreground">{formatDate(o.created_at) ?? '—'}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">
                  {o.total_amount != null ? formatMoney(o.total_amount) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
