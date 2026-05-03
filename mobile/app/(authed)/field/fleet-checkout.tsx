import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

interface Vehicle {
  id: number;
  vehicle_name: string;
  license_plate?: string | null;
  status: string;
}

export default function FieldFleetCheckoutPage() {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['fleet', 'available'],
    queryFn: () => api<{ fleet?: Vehicle[]; rows?: Vehicle[] }>('/api/fleet?filter[status]=available&limit=100'),
  });
  const rows = q.data?.rows ?? q.data?.fleet ?? [];

  const checkout = useMutation({
    mutationFn: (vehicleId: number) =>
      api('/api/fleet/checkout', {
        method: 'POST',
        body: JSON.stringify({ vehicle_id: vehicleId }),
      }),
    onSuccess: () => {
      toast.success(t('vehicle_checked_out'));
      qc.invalidateQueries({ queryKey: ['fleet'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Error'),
  });

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('vehicle_checkout')} />
      <FlatList
        data={rows}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
        ListEmptyComponent={q.isLoading ? null : <EmptyState title={t('no_results')} icon={Car} />}
        renderItem={({ item }) => (
          <View className="rounded-2xl border border-border bg-card p-5">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
                  {item.vehicle_name}
                </Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">
                  {item.license_plate ?? '—'}
                </Text>
              </View>
              <Badge tone="success">{item.status}</Badge>
            </View>
            <View className="mt-3">
              <Button
                onPress={() => checkout.mutate(item.id)}
                loading={checkout.isPending && checkout.variables === item.id}
                fullWidth
                size="lg"
              >
                {t('check_out')}
              </Button>
            </View>
          </View>
        )}
      />
    </View>
  );
}
