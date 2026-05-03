import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';

interface AttRow {
  id: number;
  user_id: number;
  user_name?: string | null;
  status: string;
  checked_in_at: string;
  checked_out_at?: string | null;
}

const tone = (s: string): any => {
  if (/in/i.test(s) && !/out/i.test(s)) return 'success';
  if (/out/i.test(s)) return 'muted';
  if (/outside/i.test(s)) return 'warning';
  return 'muted';
};

export default function AdminAttendancePage() {
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ['attendance', 'all'],
    queryFn: () => api<{ rows?: AttRow[]; attendance?: AttRow[] }>('/api/attendance/all?limit=100'),
  });
  const rows = q.data?.rows ?? q.data?.attendance ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('attendance')} />
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
        ListEmptyComponent={q.isLoading ? null : <EmptyState title={t('no_results')} icon={Clock} />}
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <Avatar name={item.user_name ?? `#${item.user_id}`} size={36} />
            <View className="flex-1">
              <Text className="font-semibold text-foreground" numberOfLines={1}>
                {item.user_name ?? `#${item.user_id}`}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {new Date(item.checked_in_at).toLocaleString()}
                {item.checked_out_at ? ` → ${new Date(item.checked_out_at).toLocaleTimeString()}` : ''}
              </Text>
            </View>
            <Badge tone={tone(item.status)}>{item.status}</Badge>
          </View>
        )}
      />
    </View>
  );
}
