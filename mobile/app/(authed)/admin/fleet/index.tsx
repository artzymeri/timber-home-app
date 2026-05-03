import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Truck } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';

interface Vehicle {
  id: number;
  vehicle_name: string;
  license_plate?: string | null;
  status: string;
  type?: string | null;
}

const statusTone = (s: string): any => {
  if (/available/i.test(s)) return 'success';
  if (/maintenance|service/i.test(s)) return 'warning';
  if (/out|in.use|checked.out/i.test(s)) return 'info';
  return 'muted';
};

export default function AdminFleetPage() {
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ['fleet'],
    queryFn: () => api<{ fleet?: Vehicle[]; rows?: Vehicle[] }>('/api/fleet?limit=100'),
  });
  const rows: Vehicle[] = q.data?.rows ?? q.data?.fleet ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('fleet')} />
      <FlatList
        data={rows}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
        ListEmptyComponent={q.isLoading ? null : <EmptyState title={t('no_results')} icon={Truck} />}
        renderItem={({ item }) => (
          <View className="rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="font-semibold text-foreground" numberOfLines={1}>
                  {item.vehicle_name}
                </Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">
                  {item.type ?? '—'} · {item.license_plate ?? '—'}
                </Text>
              </View>
              <Badge tone={statusTone(item.status)}>{item.status}</Badge>
            </View>
          </View>
        )}
      />
    </View>
  );
}
