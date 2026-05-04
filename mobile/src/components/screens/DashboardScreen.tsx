import { useMemo } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { MetricCard } from '@/components/MetricCard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { StageDistribution } from '@/components/charts/StageDistribution';
import { StageBadge } from '@/components/StageBadge';
import { useMachineryErrorCount } from '@/hooks/useMachineryErrorCount';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { Stage } from '@/lib/stages';
import { formatMoney } from '@/lib/utils';

interface AnalyticsSales {
  total_revenue?: number;
  monthly?: { month: string; revenue: number; orders: number }[];
}
interface AnalyticsProduction {
  by_stage?: { stage_name: string; count: number }[];
}
interface AnalyticsInventory {
  total_value?: number;
  low_stock_count?: number;
}
interface OrderRow {
  id: number;
  client_name: string;
  total_amount?: number | string | null;
  created_at: string;
  stage_id: number;
  stage?: Stage;
}

const greetingKey = (): 'greeting_morning' | 'greeting_afternoon' | 'greeting_evening' => {
  const h = new Date().getHours();
  if (h < 12) return 'greeting_morning';
  if (h < 18) return 'greeting_afternoon';
  return 'greeting_evening';
};

export function DashboardScreen({ basePath }: { basePath: 'admin' | 'office' }) {
  const { t } = useI18n();
  const { user, hasCapability } = useAuth();
  const router = useRouter();
  const isAdmin = hasCapability('*');
  const firstName = user?.name?.split(' ')[0] ?? '';

  const machineryErrors = useMachineryErrorCount(isAdmin);

  const sales = useQuery({
    queryKey: ['analytics', 'sales'],
    queryFn: () => api<AnalyticsSales>('/api/analytics/sales'),
  });
  const prod = useQuery({
    queryKey: ['analytics', 'production'],
    queryFn: () => api<AnalyticsProduction>('/api/analytics/production'),
  });
  const inv = useQuery({
    queryKey: ['analytics', 'inventory'],
    queryFn: () => api<AnalyticsInventory>('/api/analytics/inventory'),
  });
  const recent = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () =>
      api<{ orders?: OrderRow[]; rows?: OrderRow[] }>(
        '/api/orders?limit=5&sort=created_at&order=desc'
      ),
  });

  const refreshing =
    sales.isFetching || prod.isFetching || inv.isFetching || recent.isFetching;
  const onRefresh = () => {
    sales.refetch();
    prod.refetch();
    inv.refetch();
    recent.refetch();
  };

  const stages = prod.data?.by_stage ?? [];
  const inProduction = stages
    .filter((s) => !/complete|cancel|reject/i.test(s.stage_name))
    .reduce((s, x) => s + Number(x.count || 0), 0);
  const completed = stages.find((s) => /complete/i.test(s.stage_name))?.count ?? 0;
  const totalRevenue = Number(sales.data?.total_revenue ?? 0);
  const inventoryValue = Number(inv.data?.total_value ?? 0);
  const lowStock = inv.data?.low_stock_count ?? 0;

  const recentOrders = (recent.data?.rows ?? recent.data?.orders ?? []).slice(0, 5);
  const monthly = sales.data?.monthly ?? [];

  const heroSubtitle = useMemo(() => {
    if (sales.isLoading) return t('dashboard_loading_hint');
    if (totalRevenue > 0) return `${formatMoney(totalRevenue)} ${t('dashboard_total_revenue_hint')}`;
    return t('dashboard_welcome_hint');
  }, [sales.isLoading, totalRevenue, t]);

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('dashboard')} />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero greeting */}
        <Animated.View
          entering={FadeIn.duration(450)}
          className="overflow-hidden rounded-3xl border border-border bg-card p-5"
        >
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={14} color="#0ea5e9" />
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t(greetingKey())}
            </Text>
          </View>
          <Text className="mt-1 text-2xl font-bold tracking-tight text-foreground" numberOfLines={1}>
            {firstName ? `${firstName} 👋` : t('dashboard')}
          </Text>
          <Text className="mt-0.5 text-sm text-muted-foreground" numberOfLines={2}>
            {heroSubtitle}
          </Text>
        </Animated.View>

        {/* Machinery error alert — shown only when ≥1 machine reports an issue */}
        {machineryErrors.count > 0 && (
          <Animated.View entering={FadeInDown.duration(450).delay(80)}>
            <Pressable
              onPress={() => router.push('/admin/machinery' as any)}
              className="flex-row items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 active:opacity-80"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-rose-500/20">
                <AlertTriangle size={18} color="#f43f5e" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-rose-700 dark:text-rose-300">
                  {machineryErrors.count}{' '}
                  {t(machineryErrors.count === 1 ? 'machinery_alert_one' : 'machinery_alert_title')}
                </Text>
                <Text className="mt-0.5 text-xs text-rose-700/70 dark:text-rose-300/70" numberOfLines={1}>
                  {machineryErrors.machines.map((m) => m.name).join(' · ')}
                </Text>
              </View>
              <ChevronRight size={16} color="#f43f5e" />
            </Pressable>
          </Animated.View>
        )}

        {sales.isLoading && stages.length === 0 ? (
          <View className="py-16 items-center">
            <ActivityIndicator />
          </View>
        ) : (
          <>
            {/* KPI grid 2×2 */}
            <View className="flex-row flex-wrap gap-3">
              <View className="flex-1 min-w-[45%]">
                <MetricCard
                  label={t('total')}
                  value={totalRevenue}
                  format={(n) => `€${Math.round(n).toLocaleString()}`}
                  hint={t('dashboard_total_revenue_hint')}
                  icon={ShoppingCart}
                  href={`/${basePath}/orders`}
                  tone="brand"
                  index={0}
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <MetricCard
                  label={t('orders')}
                  value={inProduction}
                  hint={`${stages.length} ${t('stages_title')}`}
                  icon={Truck}
                  href={`/${basePath}/orders`}
                  tone="info"
                  index={1}
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <MetricCard
                  label={t('inventory')}
                  value={inventoryValue}
                  format={(n) => `€${Math.round(n).toLocaleString()}`}
                  hint={lowStock > 0 ? `${lowStock} ${t('low_stock')}` : t('dashboard_inventory_ok')}
                  icon={Package}
                  href={isAdmin ? '/admin/inventory' : undefined}
                  tone={lowStock > 0 ? 'warning' : 'default'}
                  index={2}
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <MetricCard
                  label={t('stages_terminal')}
                  value={completed}
                  hint={t('dashboard_completed_hint')}
                  icon={CheckCircle2}
                  tone="success"
                  index={3}
                />
              </View>
            </View>

            {/* Admin-only charts */}
            {isAdmin && monthly.length > 0 && (
              <RevenueChart data={monthly} title={t('analytics_revenue_trend')} />
            )}
            {isAdmin && stages.length > 0 && (
              <StageDistribution data={stages} title={t('analytics_stage_distribution')} />
            )}

            {/* Recent orders */}
            {recentOrders.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(500).delay(400)}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <View className="flex-row items-center justify-between pb-2">
                  <Text className="text-sm font-semibold text-foreground">
                    {t('dashboard_recent_orders')}
                  </Text>
                  <Pressable
                    onPress={() => router.push(`/${basePath}/orders` as any)}
                    className="flex-row items-center gap-1"
                  >
                    <Text className="text-xs font-medium text-muted-foreground">{t('see_all')}</Text>
                    <ArrowRight size={12} color="#78716c" />
                  </Pressable>
                </View>
                {recentOrders.map((o) => (
                  <Pressable
                    key={o.id}
                    onPress={() => router.push(`/${basePath}/orders/${o.id}` as any)}
                    className="flex-row items-center gap-2 border-t border-border py-2.5 active:opacity-70"
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                        #{o.id} · {o.client_name}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}
                      </Text>
                    </View>
                    {o.stage && <StageBadge stage={o.stage} />}
                    <Text className="ml-2 text-sm font-semibold tabular-nums text-foreground">
                      {o.total_amount != null ? formatMoney(o.total_amount) : '—'}
                    </Text>
                  </Pressable>
                ))}
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
