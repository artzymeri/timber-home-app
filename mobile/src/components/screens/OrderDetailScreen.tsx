import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StageBadge } from '@/components/StageBadge';
import { OrderQrCard } from '@/components/OrderQrCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import type { Stage } from '@/lib/stages';
import { formatMoney } from '@/lib/utils';

interface OrderDetailData {
  id: number;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  address: string;
  notes?: string | null;
  total_amount?: number | string | null;
  stage_id: number;
  stage?: Stage;
  qr_token?: string;
}
interface BomItem {
  id: number;
  material_name: string;
  quantity: number | string;
  unit?: string | null;
  unit_cost: number | string;
  total_cost: number | string;
}
interface MeasurementRow {
  id: number;
  room_name: string;
  dimensions: string | { width?: number; height?: number; depth?: number };
}

export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { hasCapability } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [advancing, setAdvancing] = useState(false);

  const order = useQuery({
    queryKey: ['order', id],
    queryFn: () => api<{ order: OrderDetailData }>(`/api/orders/${id}`),
  });
  const bom = useQuery({
    queryKey: ['bom', id],
    queryFn: () => api<{ items: BomItem[] }>(`/api/bom/${id}`).catch(() => ({ items: [] })),
  });
  const meas = useQuery({
    queryKey: ['measurements', id],
    queryFn: () =>
      api<{ measurements: MeasurementRow[] }>(`/api/measurements/${id}`).catch(() => ({
        measurements: [],
      })),
  });

  const advance = useMutation({
    mutationFn: () => api<{ order: OrderDetailData }>(`/api/orders/${id}/stage`, { method: 'PATCH' }),
    onSuccess: () => {
      toast.success(t('stage_advance_done'));
      qc.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Error'),
  });

  const o = order.data?.order;
  const canAdvance = hasCapability('orders.advance_stage');
  const isTerminal = o?.stage?.is_terminal;
  const items = bom.data?.items ?? [];
  const bomTotal = items.reduce((s, i) => s + (Number(i.total_cost) || 0), 0);

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={`#${id}`} showBack />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {!o ? (
          <View className="gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </View>
        ) : (
          <>
            <Card>
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-lg font-bold text-foreground">{o.client_name}</Text>
                  <Text className="text-sm text-muted-foreground">{o.address}</Text>
                </View>
                {o.stage && <StageBadge stage={o.stage} />}
              </View>
              {canAdvance && (
                <View className="mt-3">
                  <Button
                    onPress={() => {
                      setAdvancing(true);
                      advance.mutate(undefined, { onSettled: () => setAdvancing(false) });
                    }}
                    loading={advancing}
                    disabled={isTerminal}
                    fullWidth
                  >
                    {t('advance_stage')}
                  </Button>
                </View>
              )}
            </Card>

            <Card>
              <CardTitle>{t('client_information')}</CardTitle>
              <View className="mt-3 gap-1.5">
                <Row label={t('email')} value={o.client_email ?? '—'} />
                <Row label={t('vehicle_type')} value={o.client_phone ?? '—'} />
                <Row label={t('total')} value={o.total_amount != null ? formatMoney(o.total_amount) : '—'} />
                {o.notes && <Text className="mt-2 text-sm text-muted-foreground">{o.notes}</Text>}
              </View>
            </Card>

            <OrderQrCard token={o.qr_token} />

            <Card>
              <CardTitle>{t('measurements_title')}</CardTitle>
              {meas.isLoading ? (
                <Skeleton className="mt-3 h-20" />
              ) : (meas.data?.measurements?.length ?? 0) === 0 ? (
                <EmptyState title={t('table_empty')} className="mt-3" />
              ) : (
                <View className="mt-3 gap-2">
                  {meas.data!.measurements.map((m) => {
                    const d =
                      typeof m.dimensions === 'string'
                        ? (() => {
                            try {
                              return JSON.parse(m.dimensions);
                            } catch {
                              return {};
                            }
                          })()
                        : m.dimensions || {};
                    return (
                      <View key={m.id} className="flex-row items-center justify-between border-b border-border py-2">
                        <Text className="font-medium text-foreground">{m.room_name}</Text>
                        <Text className="text-sm tabular-nums text-muted-foreground">
                          {d.width ?? '—'} × {d.height ?? '—'} × {d.depth ?? '—'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>

            <Card>
              <CardTitle>{t('bom_title')}</CardTitle>
              {bom.isLoading ? (
                <Skeleton className="mt-3 h-20" />
              ) : items.length === 0 ? (
                <EmptyState title={t('bom_placeholder')} className="mt-3" />
              ) : (
                <View className="mt-3 gap-2">
                  {items.map((it) => (
                    <View key={it.id} className="flex-row items-center justify-between border-b border-border py-2">
                      <View className="flex-1 pr-2">
                        <Text className="font-medium text-foreground" numberOfLines={1}>{it.material_name}</Text>
                        <Text className="text-xs text-muted-foreground">
                          {it.quantity} {it.unit ?? ''} · {formatMoney(it.unit_cost)}
                        </Text>
                      </View>
                      <Text className="text-sm font-semibold tabular-nums text-foreground">
                        {formatMoney(it.total_cost)}
                      </Text>
                    </View>
                  ))}
                  <View className="mt-1 flex-row justify-between">
                    <Text className="text-sm font-semibold text-foreground">{t('total')}</Text>
                    <Text className="text-sm font-bold tabular-nums text-foreground">{formatMoney(bomTotal)}</Text>
                  </View>
                </View>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm text-foreground">{value}</Text>
    </View>
  );
}
