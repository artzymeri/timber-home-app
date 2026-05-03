import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';

interface UserRow {
  id: number;
  name: string;
  email: string;
  role?: { id: number; role_name: string } | null;
}

export default function AdminUsersPage() {
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ['users'],
    queryFn: () => api<{ users?: UserRow[]; rows?: UserRow[] }>('/api/users?limit=100'),
  });
  const rows: UserRow[] = q.data?.rows ?? q.data?.users ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('users_title')} />
      <FlatList
        data={rows}
        keyExtractor={(u) => String(u.id)}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
        ListEmptyComponent={q.isLoading ? null : <EmptyState title={t('no_results')} icon={Users} />}
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <Avatar name={item.name} size={40} />
            <View className="flex-1">
              <Text className="font-semibold text-foreground" numberOfLines={1}>{item.name}</Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>{item.email}</Text>
            </View>
            {item.role && <Badge tone="muted">{item.role.role_name}</Badge>}
          </View>
        )}
      />
    </View>
  );
}
