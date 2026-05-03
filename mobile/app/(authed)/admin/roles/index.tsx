import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Star } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { resolveIcon } from '@/lib/icon-resolver';

interface RoleRow {
  id: number;
  role_name: string;
  icon: string;
  description?: string | null;
  is_system: boolean;
  permissions: string[];
  allowed_pages?: string[];
  default_route: string;
}

export default function AdminRolesPage() {
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ['roles'],
    queryFn: () => api<{ roles: RoleRow[] }>('/api/roles'),
  });
  const rows = q.data?.roles ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('roles_title')} />
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
        ListEmptyComponent={q.isLoading ? null : <EmptyState title={t('no_results')} icon={ShieldCheck} />}
        renderItem={({ item }) => {
          const Icon = resolveIcon(item.icon);
          const pagesCount = item.allowed_pages?.includes('*')
            ? '*'
            : (item.allowed_pages?.length ?? 0);
          return (
            <View className="rounded-2xl border border-border bg-card p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Icon size={18} color="#1c1917" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-semibold text-foreground">{item.role_name}</Text>
                    {item.is_system && <Badge tone="muted">{t('system')}</Badge>}
                  </View>
                  {item.description && (
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                </View>
              </View>
              <View className="mt-3 flex-row items-center gap-3">
                <Text className="text-xs text-muted-foreground">
                  {t('role_pages')}: <Text className="font-semibold text-foreground">{pagesCount}</Text>
                </Text>
                <View className="flex-row items-center gap-1">
                  <Star size={12} color="#78716c" />
                  <Text className="text-xs text-muted-foreground">{item.default_route}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
