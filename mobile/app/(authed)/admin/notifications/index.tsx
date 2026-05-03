import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Notif {
  id: number;
  title: string;
  message?: string | null;
  type?: string | null;
  read: boolean;
  created_at: string;
}

const tone = (t?: string | null): any => {
  if (!t) return 'muted';
  if (/warn/i.test(t)) return 'warning';
  if (/error/i.test(t)) return 'destructive';
  if (/success/i.test(t)) return 'success';
  return 'info';
};

export default function AdminNotificationsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<{ notifications?: Notif[]; rows?: Notif[] }>('/api/notifications?limit=100'),
  });
  const rows = q.data?.rows ?? q.data?.notifications ?? [];

  const markRead = useMutation({
    mutationFn: (id: number) => api(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: () => api(`/api/notifications/read-all`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const hasUnread = rows.some((n) => !n.read);

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('notifications')} />
      {hasUnread && (
        <View className="border-b border-border bg-card px-4 py-2">
          <Pressable onPress={() => markAll.mutate()} className="self-end">
            <Text className="text-sm font-medium text-foreground">{t('mark_all_read')}</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={rows}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
        ListEmptyComponent={q.isLoading ? null : <EmptyState title={t('notifications_empty')} icon={Bell} tone="success" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => !item.read && markRead.mutate(item.id)}
            className={cn(
              'rounded-2xl border border-border p-4',
              item.read ? 'bg-card' : 'bg-accent'
            )}
          >
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 font-semibold text-foreground" numberOfLines={1}>
                {item.title}
              </Text>
              {item.type && <Badge tone={tone(item.type)}>{item.type}</Badge>}
            </View>
            {item.message && (
              <Text className="mt-1 text-sm text-muted-foreground" numberOfLines={2}>
                {item.message}
              </Text>
            )}
            <Text className="mt-2 text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
