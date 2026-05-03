import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/utils';

interface POrow {
  id: number;
  item_name: string;
  quantity: number;
  total_cost: number | string;
  status: string;
  created_at: string;
}

const tone = (s: string): any => {
  if (/approved/i.test(s)) return 'success';
  if (/pending|review/i.test(s)) return 'warning';
  if (/reject|cancel/i.test(s)) return 'destructive';
  return 'muted';
};

export default function AdminPurchaseOrdersPage() {
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => api<{ purchase_orders?: POrow[]; rows?: POrow[] }>('/api/purchase-orders?limit=100'),
  });
  const rows: POrow[] = q.data?.rows ?? q.data?.purchase_orders ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('purchase_orders')} />
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
        ListEmptyComponent={q.isLoading ? null : <EmptyState title={t('no_results')} icon={ClipboardList} />}
        renderItem={({ item }) => (
          <View className="rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="font-mono text-xs text-muted-foreground">#{item.id}</Text>
                <Text className="mt-0.5 font-semibold text-foreground" numberOfLines={1}>
                  {item.item_name}
                </Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">
                  {item.quantity} · {formatDate(item.created_at)}
                </Text>
              </View>
              <Badge tone={tone(item.status)}>{item.status}</Badge>
            </View>
            <View className="mt-2 flex-row justify-end">
              <Text className="text-base font-semibold tabular-nums text-foreground">
                {formatMoney(item.total_cost)}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
