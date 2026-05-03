import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StageBadge } from '@/components/StageBadge';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { Stage } from '@/lib/stages';

interface OrderRow {
  id: number;
  client_name: string;
  address: string;
  stage_id: number;
  stage?: Stage;
}

export default function FieldSchedulePage() {
  const { t } = useI18n();
  const router = useRouter();

  const q = useQuery({
    queryKey: ['orders', 'schedule-mine'],
    queryFn: () => api<{ orders?: OrderRow[]; rows?: OrderRow[] }>('/api/orders?filter[assigned_to]=me&limit=100'),
  });
  const rows = q.data?.rows ?? q.data?.orders ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('todays_schedule')} />
      <FlatList
        data={rows}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
        ListEmptyComponent={q.isLoading ? null : <EmptyState title={t('table_empty')} icon={Calendar} tone="success" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/admin/orders/${item.id}` as any)}
            className="rounded-2xl border border-border bg-card p-5 active:opacity-80"
          >
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
                  {item.client_name}
                </Text>
                <View className="mt-1 flex-row items-center gap-1.5">
                  <MapPin size={12} color="#78716c" />
                  <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              </View>
              {item.stage && <StageBadge stage={item.stage} />}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
