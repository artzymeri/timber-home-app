import { FlatList, RefreshControl, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Cog } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { MachineryBlueprintCard, type Machine } from '@/components/MachineryBlueprintCard';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';

export default function AdminMachineryPage() {
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ['machinery'],
    queryFn: () => api<{ machinery: Machine[] }>('/api/machinery'),
  });
  const rows = q.data?.machinery ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('machinery')} />
      <FlatList
        data={rows}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
        ListEmptyComponent={q.isLoading ? null : <EmptyState title={t('machinery_no_results')} icon={Cog} />}
        renderItem={({ item }) => <MachineryBlueprintCard machine={item} />}
      />
    </View>
  );
}
