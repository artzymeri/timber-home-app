'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Package,
  ClipboardList,
  Plus,
  ArrowRight,
  CheckCircle2,
  Coins,
  Hourglass,
  RefreshCcw,
  Sparkles,
  Truck,
  Users,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer } from '@/components/page-container';
import { MetricCard } from '@/components/metric-card';
import { AnimatedNumber } from '@/components/animated-number';
import { useAuth } from '@/lib/auth-context';
import { EmptyState } from '@/components/empty-state';
import { StageBadge } from '@/components/stage-badge';
import { resolveIcon } from '@/lib/icon-resolver';
import { colorClasses, type Stage, type StageColor } from '@/lib/stages';
import { useI18n } from '@/lib/i18n';
import type { TranslationKeys } from '@/lib/i18n/en';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface OrderRow {
  id: number;
  client_name: string;
  address: string;
  total_amount?: number | string | null;
  created_at: string;
  stage_id: number;
  stage?: Stage;
}

interface InventoryRow {
  id: number;
  name: string;
  quantity: number;
  reorder_level: number;
  unit?: string;
}

interface SalesAnalytics {
  monthly: Array<{ month: string; order_count: number | string; revenue: number | string }>;
}

interface ProductionAnalytics {
  stageDistribution: Array<{
    status: string;
    name: string;
    label_key: string | null;
    color: string;
    icon: string;
    count: number;
  }>;
  completedThisMonth: number;
}

interface InventoryAnalytics {
  lowStock: InventoryRow[];
  totalValue: number;
}

const formatMoney = (n: number | string | null | undefined): string => {
  const v = typeof n === 'string' ? parseFloat(n) : n || 0;
  if (v >= 1000) return `€${(v / 1000).toFixed(1)}k`;
  return `€${v.toFixed(0)}`;
};

type Period = '3m' | '30d' | '7d';

interface MachineryAlert {
  count: number;
  machines: { id: number; name: string }[];
}

const trendChartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-2)' },
  orders: { label: 'Orders', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export default function AdminDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [production, setProduction] = useState<ProductionAnalytics | null>(null);
  const [inventory, setInventory] = useState<InventoryAnalytics | null>(null);
  const [sales, setSales] = useState<SalesAnalytics | null>(null);
  const [machineryAlert, setMachineryAlert] = useState<MachineryAlert>({ count: 0, machines: [] });
  const [refreshKey, setRefreshKey] = useState(0);
  const [period, setPeriod] = useState<Period>('3m');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<{ orders: OrderRow[] }>('/api/orders'),
      api<ProductionAnalytics>('/api/analytics/production'),
      api<InventoryAnalytics>('/api/analytics/inventory'),
      api<SalesAnalytics>('/api/analytics/sales'),
      api<MachineryAlert>('/api/machinery/error-count').catch(() => ({ count: 0, machines: [] })),
    ])
      .then(([o, p, i, s, m]) => {
        if (cancelled) return;
        setOrders(o.orders);
        setProduction(p);
        setInventory(i);
        setSales(s);
        setMachineryAlert(m);
      })
      .catch((e) => !cancelled && toast.error(e instanceof Error ? e.message : 'Error'));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const kpis = useMemo(() => {
    const inProduction = orders?.filter((o) => o.stage && !o.stage.is_terminal && !o.stage.is_initial).length ?? 0;
    const pipelineValue = orders
      ? orders
          .filter((o) => o.stage && !o.stage.is_terminal)
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
      : 0;
    const completedMonth = production?.completedThisMonth ?? 0;
    const lowStockCount = inventory?.lowStock.length ?? 0;
    return { inProduction, pipelineValue, completedMonth, lowStockCount };
  }, [orders, production, inventory]);

  const recentOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [orders]);

  const pipelineStages = useMemo(() => {
    if (!production) return [];
    return production.stageDistribution.map((s) => ({ ...s, count: Number(s.count) }));
  }, [production]);

  const maxStageCount = Math.max(1, ...pipelineStages.map((s) => s.count));

  const chartData = useMemo(() => {
    if (!sales?.monthly) return [];
    const monthsToShow = period === '3m' ? 3 : period === '30d' ? 6 : 12;
    return [...sales.monthly]
      .reverse()
      .slice(0, monthsToShow)
      .map((row) => ({
        month: row.month,
        orders: Number(row.order_count) || 0,
        revenue: Number(row.revenue) || 0,
      }));
  }, [sales, period]);

  // Hero number + revenue delta vs prior period.
  const monthlyAsc = useMemo(() => {
    if (!sales?.monthly) return [] as { revenue: number; orders: number }[];
    return [...sales.monthly]
      .reverse() // backend returns DESC; mirror to ASC for trend math
      .map((r) => ({ revenue: Number(r.revenue) || 0, orders: Number(r.order_count) || 0 }));
  }, [sales]);

  const heroRevenue = monthlyAsc[monthlyAsc.length - 1]?.revenue ?? 0;
  const revenueTrend = useMemo(() => {
    const last = monthlyAsc[monthlyAsc.length - 1]?.revenue ?? 0;
    const prev = monthlyAsc[monthlyAsc.length - 2]?.revenue ?? 0;
    if (prev === 0) return undefined;
    const pct = ((last - prev) / prev) * 100;
    return {
      value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
      direction: pct > 0.5 ? ('up' as const) : pct < -0.5 ? ('down' as const) : ('flat' as const),
    };
  }, [monthlyAsc]);

  const greetingKey: TranslationKeys = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'greeting_morning';
    if (h < 18) return 'greeting_afternoon';
    return 'greeting_evening';
  })();
  const firstName = user?.name?.split(' ')[0] ?? '';

  const attentionItems = useMemo(() => {
    if (!inventory) return [];
    return inventory.lowStock.slice(0, 5).map((item) => ({
      key: `low-${item.id}`,
      icon: AlertTriangle,
      tone: 'amber' as const,
      title: item.name,
      subtitle: `${item.quantity}/${item.reorder_level} ${item.unit ?? ''}`.trim(),
      href: '/admin/inventory',
    }));
  }, [inventory]);

  const loading = orders === null || production === null || inventory === null || sales === null;

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        {/* Hero greeting card */}
        <div className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-8 animate-in fade-in-0 slide-in-from-top-2 duration-500">
          {/* decorative blurred orbs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/15"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10"
          />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-brand" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(greetingKey)}{firstName && `, ${firstName}`}
                </span>
              </div>
              <h1 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">
                {t('dashboard_overview')}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                {t('dashboard_hero_subtitle')}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t('dashboard_hero_revenue')}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
                  {loading ? (
                    <Skeleton className="h-9 w-32" />
                  ) : (
                    <AnimatedNumber
                      value={heroRevenue}
                      format={(n) =>
                        n >= 1000 ? `€${(n / 1000).toFixed(1)}k` : `€${Math.round(n).toLocaleString()}`
                      }
                    />
                  )}
                </p>
                {revenueTrend && !loading && (
                  <span
                    className={cn(
                      'mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                      revenueTrend.direction === 'up' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
                      revenueTrend.direction === 'down' && 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
                      revenueTrend.direction === 'flat' && 'bg-muted text-muted-foreground'
                    )}
                  >
                    <TrendingUp size={11} className={cn(revenueTrend.direction === 'down' && 'rotate-180')} />
                    {revenueTrend.value}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshKey((k) => k + 1)}
                disabled={loading}
                className="self-start sm:self-end"
              >
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                <span>{t('dashboard_refresh')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick actions — horizontal pill strip directly under the hero */}
        <div className="-mt-2 flex flex-wrap items-center gap-2 animate-in fade-in-0 duration-500">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 mr-1">
            {t('dashboard_quick_actions')}
          </span>
          <Link
            href="/admin/orders?create=1"
            className="group inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Plus size={13} />
            {t('create_order')}
          </Link>
          {[
            { href: '/admin/users/new', icon: Users, label: t('users_invite') },
            { href: '/admin/stages/new', icon: ClipboardList, label: t('stages_create') },
            { href: '/admin/inventory', icon: Package, label: t('inventory') },
            { href: '/admin/fleet', icon: Truck, label: t('fleet') },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-accent hover:text-foreground"
              >
                <Icon size={13} className="text-muted-foreground" />
                {action.label}
              </Link>
            );
          })}
        </div>

        {machineryAlert.count > 0 && (
          <Link
            href="/admin/machinery"
            className="group flex items-start gap-3 rounded-2xl border border-rose-300/40 bg-rose-50 p-4 transition-colors hover:bg-rose-100/60 animate-in fade-in-0 slide-in-from-top-1 duration-500 dark:border-rose-500/30 dark:bg-rose-500/5 dark:hover:bg-rose-500/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/15">
              <AlertTriangle size={18} className="text-rose-600 dark:text-rose-300" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-rose-900 dark:text-rose-200">
                {machineryAlert.count}{' '}
                {t(machineryAlert.count === 1 ? 'machinery_alert_one' : 'machinery_alert_title')}
              </p>
              <p className="mt-0.5 text-sm text-rose-700/80 dark:text-rose-300/70">
                {machineryAlert.machines.map((m) => m.name).join(' · ')}
              </p>
            </div>
            <ArrowRight size={16} className="mt-3 text-rose-600 transition-transform group-hover:translate-x-0.5 dark:text-rose-300" />
          </Link>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in-0 duration-500">
          <MetricCard
            icon={Coins}
            label={t('dashboard_pipeline_value')}
            hint={t('dashboard_pipeline_value_help')}
            value={loading ? '—' : kpis.pipelineValue}
            format={(n) => formatMoney(n)}
            loading={loading}
            href="/admin/orders"
            tone="default"
          />
          <MetricCard
            icon={Hourglass}
            label={t('dashboard_in_production')}
            hint={t('dashboard_in_production_help')}
            value={loading ? '—' : kpis.inProduction}
            loading={loading}
            href="/admin/orders"
            tone="violet"
          />
          <MetricCard
            icon={CheckCircle2}
            label={t('dashboard_completed_month')}
            hint={t('dashboard_completed_month_help')}
            value={loading ? '—' : kpis.completedMonth}
            loading={loading}
            tone="emerald"
          />
          <MetricCard
            icon={AlertTriangle}
            label={t('dashboard_low_stock')}
            hint={t('dashboard_low_stock_help')}
            value={loading ? '—' : kpis.lowStockCount}
            loading={loading}
            tone={kpis.lowStockCount > 0 ? 'amber' : 'default'}
            href="/admin/inventory"
          />
        </div>

        {/* Trend chart — shadcn Area Chart Gradient */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">{t('orders_count')}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{t('total_for_period')}</p>
              </div>
              <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <TabsList>
                  <TabsTrigger value="3m">{t('period_3_months')}</TabsTrigger>
                  <TabsTrigger value="30d">{t('period_30_days')}</TabsTrigger>
                  <TabsTrigger value="7d">{t('period_7_days')}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center">
                <EmptyState tone="info" title={t('dashboard_no_data')} compact />
              </div>
            ) : (
              <ChartContainer config={trendChartConfig} className="h-[260px] w-full">
                <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
                  <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Area
                    dataKey="revenue"
                    type="natural"
                    fill="url(#fillRevenue)"
                    fillOpacity={0.4}
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                  />
                  <Area
                    dataKey="orders"
                    type="natural"
                    fill="url(#fillOrders)"
                    fillOpacity={0.4}
                    stroke="var(--color-orders)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
          {revenueTrend && !loading && (
            <CardFooter className="flex-col items-start gap-1 pt-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                {t('dashboard_hero_revenue')} {revenueTrend.value}{' '}
                <TrendingUp
                  size={14}
                  className={cn(
                    revenueTrend.direction === 'up' && 'text-emerald-500',
                    revenueTrend.direction === 'down' && 'rotate-180 text-rose-500',
                    revenueTrend.direction === 'flat' && 'text-muted-foreground'
                  )}
                />
              </div>
            </CardFooter>
          )}
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{t('dashboard_pipeline')}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard_pipeline_help')}</p>
                </div>
                <Link href="/admin/stages" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  <span>{t('stages_title')}</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-7 w-full" />
                  ))}
                </div>
              ) : pipelineStages.length === 0 ? (
                <EmptyState tone="info" compact title={t('dashboard_no_data')} />
              ) : (
                <div className="space-y-3">
                  {pipelineStages.map((s) => {
                    const Icon = resolveIcon(s.icon);
                    const cc = colorClasses(s.color as StageColor);
                    const widthPct = (s.count / maxStageCount) * 100;
                    return (
                      <div key={s.status} className="flex items-center gap-3">
                        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md shrink-0', cc.chip)}>
                          <Icon size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">
                              {s.label_key ? t(s.label_key as TranslationKeys) : s.name}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">{s.count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={cn('h-full rounded-full', cc.chip)} style={{ width: `${widthPct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                {t('dashboard_attention')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : attentionItems.length === 0 ? (
                <EmptyState
                  tone="success"
                  icon={ShieldCheck}
                  title={t('dashboard_attention_empty')}
                  compact
                />
              ) : (
                <div className="space-y-2">
                  {attentionItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 transition-colors hover:bg-amber-100/60 dark:border-amber-500/30 dark:bg-amber-500/5 dark:hover:bg-amber-500/10"
                      >
                        <Icon size={14} className="text-amber-600 dark:text-amber-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{t('dashboard_recent_orders')}</CardTitle>
                <Link href="/admin/orders" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  <span>{t('dashboard_view_all')}</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="px-6 py-8">
                  <EmptyState compact tone="info" title={t('dashboard_recent_orders_empty')} />
                </div>
              ) : (
                <div className="divide-y">
                  {recentOrders.map((o) => (
                    <Link
                      key={o.id}
                      href={`/admin/orders/${o.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <span className="text-xs font-mono">#{o.id}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{o.client_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{o.address}</p>
                      </div>
                      {o.stage && <StageBadge stage={o.stage} />}
                      <span className="hidden sm:block text-sm font-semibold tabular-nums shrink-0">
                        {o.total_amount != null ? formatMoney(o.total_amount) : '—'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </PageContainer>
  );
}
