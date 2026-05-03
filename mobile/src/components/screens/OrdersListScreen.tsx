import { useState, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StageBadge } from '@/components/StageBadge';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { Stage, StageNode } from '@/lib/stages';
import { cn, formatMoney } from '@/lib/utils';

interface OrderRow {
  id: number;
  client_name: string;
  address: string;
  total_amount?: number | string | null;
  created_at: string;
  stage_id: number;
  stage?: Stage;
}

export function OrdersListScreen({ basePath }: { basePath: string }) {
  const { t } = useI18n();
  const { hasCapability } = useAuth();
  const router = useRouter();
  const canCreate = hasCapability('orders.create');
  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState<number | null>(null);

  const stages = useQuery({
    queryKey: ['stages'],
    queryFn: () => api<{ stages: StageNode[] }>('/api/stages'),
  });

  const orders = useQuery({
    queryKey: ['orders', { q, stageFilter }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (stageFilter) params.set('filter[stage_id]', String(stageFilter));
      params.set('limit', '100');
      return api<{ orders?: OrderRow[]; rows?: OrderRow[] }>(`/api/orders?${params.toString()}`);
    },
  });

  const rows: OrderRow[] = orders.data?.rows ?? orders.data?.orders ?? [];

  const flatStages = useMemo(() => {
    const out: Stage[] = [];
    const walk = (n: StageNode) => {
      out.push(n);
      n.children?.forEach(walk);
    };
    (stages.data?.stages ?? []).forEach(walk);
    return out;
  }, [stages.data]);

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('orders')} />
      <View className="border-b border-border bg-card px-4 pb-3 pt-3 gap-3">
        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-background px-3">
          <Search size={16} color="#78716c" />
          <Input
            value={q}
            onChangeText={setQ}
            placeholder={t('client')}
            containerClassName="flex-1"
            className="h-10 border-0 bg-transparent px-0"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <Chip active={stageFilter === null} onPress={() => setStageFilter(null)} label={t('all')} />
          {flatStages.map((s) => (
            <Chip
              key={s.id}
              active={stageFilter === s.id}
              onPress={() => setStageFilter(s.id)}
              label={s.name}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={orders.isFetching} onRefresh={() => orders.refetch()} />}
        ListEmptyComponent={
          orders.isLoading ? null : <EmptyState title={t('no_orders')} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`${basePath}/${item.id}` as any)}
            className="rounded-2xl border border-border bg-card p-4 active:opacity-80"
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text className="font-mono text-xs text-muted-foreground">#{item.id}</Text>
                <Text className="mt-0.5 text-base font-semibold text-foreground" numberOfLines={1}>
                  {item.client_name}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>{item.address}</Text>
              </View>
              {item.stage && <StageBadge stage={item.stage} />}
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground">
                {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
              </Text>
              <Text className="text-sm font-semibold tabular-nums text-foreground">
                {item.total_amount != null ? formatMoney(item.total_amount) : '—'}
              </Text>
            </View>
          </Pressable>
        )}
      />

      {canCreate && (
        <View className="absolute bottom-4 right-4">
          <Button onPress={() => router.push(`${basePath}/new` as any)} size="lg">
            <Plus size={18} color="white" />
            <Text className="font-semibold text-background">{t('orders_new')}</Text>
          </Button>
        </View>
      )}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-full border px-3 py-1.5',
        active ? 'border-brand bg-brand' : 'border-border bg-card'
      )}
    >
      <Text className={cn('text-xs font-medium', active ? 'text-background' : 'text-foreground')}>
        {label}
      </Text>
    </Pressable>
  );
}
