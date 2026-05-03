import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search, Package } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/utils';

interface InventoryRow {
  id: number;
  name: string;
  category?: string | null;
  quantity: number;
  reorder_level: number;
  cost_per_unit: number | string;
}

export default function AdminInventoryPage() {
  const { t } = useI18n();
  const [q, setQ] = useState('');

  const inv = useQuery({
    queryKey: ['inventory', { q }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      params.set('limit', '100');
      return api<{ inventory?: InventoryRow[]; rows?: InventoryRow[] }>(`/api/inventory?${params}`);
    },
  });
  const rows: InventoryRow[] = inv.data?.rows ?? inv.data?.inventory ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('inventory')} />
      <View className="border-b border-border bg-card px-4 py-3">
        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-background px-3">
          <Search size={16} color="#78716c" />
          <Input
            value={q}
            onChangeText={setQ}
            placeholder={t('search_placeholder')}
            containerClassName="flex-1"
            className="h-10 border-0 bg-transparent px-0"
          />
        </View>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={inv.isFetching} onRefresh={() => inv.refetch()} />}
        ListEmptyComponent={inv.isLoading ? null : <EmptyState title={t('no_results')} icon={Package} />}
        renderItem={({ item }) => {
          const low = item.quantity <= item.reorder_level;
          return (
            <View className="rounded-2xl border border-border bg-card p-4">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground" numberOfLines={1}>{item.name}</Text>
                  {item.category && (
                    <Text className="mt-0.5 text-xs text-muted-foreground">{item.category}</Text>
                  )}
                </View>
                {low && <Badge tone="warning">{t('low_stock')}</Badge>}
              </View>
              <View className="mt-3 flex-row items-end justify-between">
                <View>
                  <Text className="text-xs text-muted-foreground">{t('quantity_label')}</Text>
                  <Text className="text-lg font-semibold tabular-nums text-foreground">
                    {item.quantity}
                    <Text className="text-xs text-muted-foreground"> / {item.reorder_level}</Text>
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-muted-foreground">{t('unit_cost')}</Text>
                  <Text className="text-sm font-medium tabular-nums text-foreground">
                    {formatMoney(item.cost_per_unit)}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
