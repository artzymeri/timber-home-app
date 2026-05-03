'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { CheckCircle2, Coins, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { EmptyState } from '@/components/empty-state';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';

interface SalesAnalytics {
  monthly: Array<{ month: string; order_count: number | string; revenue: number | string }>;
}

interface ProductionAnalytics {
  stageDistribution: Array<{
    status: string;
    name: string;
    color: string;
    icon: string;
    count: number;
  }>;
  completedThisMonth: number;
}

interface InventoryAnalytics {
  lowStock: Array<{ id: number; name: string }>;
  totalValue: number;
}

const COLOR_HEX: Record<string, string> = {
  stone: '#78716c',
  amber: '#f59e0b',
  blue: '#3b82f6',
  emerald: '#10b981',
  violet: '#8b5cf6',
  rose: '#f43f5e',
};

const formatMoney = (n: number | string | null | undefined): string => {
  const v = typeof n === 'string' ? parseFloat(n) : n || 0;
  if (v >= 1000) return `€${(v / 1000).toFixed(1)}k`;
  return `€${v.toFixed(0)}`;
};

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [sales, setSales] = useState<SalesAnalytics | null>(null);
  const [production, setProduction] = useState<ProductionAnalytics | null>(null);
  const [inventory, setInventory] = useState<InventoryAnalytics | null>(null);

  useEffect(() => {
    Promise.all([
      api<SalesAnalytics>('/api/analytics/sales'),
      api<ProductionAnalytics>('/api/analytics/production'),
      api<InventoryAnalytics>('/api/analytics/inventory'),
    ])
      .then(([s, p, i]) => {
        setSales(s);
        setProduction(p);
        setInventory(i);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  }, []);

  const loading = !sales || !production || !inventory;
  const totalRevenue = sales?.monthly.reduce((sum, row) => sum + (Number(row.revenue) || 0), 0) ?? 0;

  const chartData = sales?.monthly
    ? [...sales.monthly].reverse().map((row) => ({
        month: row.month,
        revenue: Number(row.revenue) || 0,
        orders: Number(row.order_count) || 0,
      }))
    : [];

  const pieData = production?.stageDistribution.filter((s) => Number(s.count) > 0) ?? [];

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        <PageHeader title={t('analytics_title')} description={t('analytics_subtitle')} />

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            icon={Coins}
            label={t('revenue')}
            value={loading ? '—' : formatMoney(totalRevenue)}
            loading={loading}
          />
          <MetricCard
            icon={CheckCircle2}
            label={t('analytics_completed_this_month')}
            value={loading ? '—' : production?.completedThisMonth ?? 0}
            tone="emerald"
            loading={loading}
          />
          <MetricCard
            icon={Package}
            label={t('analytics_total_inventory_value')}
            value={loading ? '—' : formatMoney(inventory?.totalValue ?? 0)}
            tone="blue"
            loading={loading}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('analytics_monthly_revenue')}</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              {loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : chartData.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center">
                  <EmptyState compact tone="info" title={t('dashboard_no_data')} />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="revenue" name={t('trend_revenue')} fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('analytics_stage_distribution_chart')}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : pieData.length === 0 ? (
                <EmptyState compact tone="info" title={t('dashboard_no_data')} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={COLOR_HEX[entry.color] || COLOR_HEX.stone} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
