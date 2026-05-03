import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { StageBadge } from '@/components/StageBadge';
import { EmptyState } from '@/components/ui/EmptyState';
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

export default function FactoryTasksPage() {
  const { t } = useI18n();
  const router = useRouter();

  const q = useQuery({
    queryKey: ['orders', 'tasks-mine'],
    queryFn: () => api<{ orders?: OrderRow[]; rows?: OrderRow[] }>('/api/orders?filter[assigned_to]=me&limit=100'),
  });
  const rows = q.data?.rows ?? q.data?.orders ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('my_tasks')} />
      <FlatList
        data={rows}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
        ListEmptyComponent={q.isLoading ? null : <EmptyState title={t('table_empty')} icon={CheckSquare} tone="success" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/factory/tasks/${item.id}` as any)}
            className="rounded-2xl border border-border bg-card p-5 active:opacity-80"
          >
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="font-mono text-xs text-muted-foreground">#{item.id}</Text>
                <Text className="mt-1 text-lg font-semibold text-foreground" numberOfLines={1}>
                  {item.client_name}
                </Text>
                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
              {item.stage && <StageBadge stage={item.stage} />}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
