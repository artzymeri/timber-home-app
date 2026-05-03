'use client';

import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Vehicle {
  id: number;
  vehicle_name: string;
  plate?: string | null;
  status: 'available' | 'checked_out' | 'maintenance' | string;
}

const STATUS_TONE: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  checked_out: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  maintenance: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export default function FleetCheckoutPage() {
  const { t } = useI18n();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = () => {
    api<{ fleet: Vehicle[] }>('/api/fleet')
      .then(({ fleet }) => setVehicles(fleet))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  };

  useEffect(() => {
    load();
  }, []);

  const checkOut = async (id: number) => {
    setBusy(id);
    try {
      await api('/api/fleet/checkout', {
        method: 'POST',
        body: JSON.stringify({ vehicle_id: id }),
      });
      toast.success(t('field_checkout_action'));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <PageContainer size="default">
      <div className="space-y-4">
        <PageHeader title={t('field_checkout_title')} description={t('field_checkout_subtitle')} />

        {vehicles === null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState tone="info" icon={Truck} title={t('field_checkout_empty')} />
        ) : (
          <div className="space-y-3">
            {vehicles.map((v) => {
              const isAvailable = v.status === 'available';
              return (
                <Card key={v.id}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-base font-semibold">{v.vehicle_name}</p>
                        <p className="text-xs text-muted-foreground">{v.plate ?? '—'}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(STATUS_TONE[v.status] || 'bg-stone-200 text-stone-700')}
                      >
                        {v.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Button
                      className="w-full h-12 text-base font-semibold"
                      onClick={() => checkOut(v.id)}
                      disabled={!isAvailable || busy === v.id}
                    >
                      {busy === v.id
                        ? '…'
                        : isAvailable
                        ? t('field_checkout_action')
                        : t('field_checkout_unavailable')}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
