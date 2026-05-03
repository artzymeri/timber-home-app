'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { StageBadge } from '@/components/stage-badge';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { Stage } from '@/lib/stages';

interface ScheduleOrder {
  id: number;
  client_name: string;
  address: string;
  notes?: string | null;
  stage_id: number;
  stage?: Stage;
  updated_at: string;
}

const FIELD_CODES = new Set(['installation', 'measurement']);

export default function FieldSchedule() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<ScheduleOrder[] | null>(null);

  useEffect(() => {
    api<{ orders: ScheduleOrder[] }>('/api/orders')
      .then(({ orders }) => setOrders(orders))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  }, []);

  const fieldJobs = (orders ?? []).filter((o) => o.stage && FIELD_CODES.has(o.stage.code));

  return (
    <PageContainer size="default">
      <div className="space-y-4">
        <PageHeader title={t('field_schedule_title')} description={t('field_schedule_subtitle')} />

        {orders === null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : fieldJobs.length === 0 ? (
          <EmptyState tone="info" icon={Calendar} title={t('field_schedule_empty')} />
        ) : (
          <div className="space-y-3">
            {fieldJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base font-semibold">#{job.id} · {job.client_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin size={11} />
                        <span className="truncate">{job.address}</span>
                      </p>
                    </div>
                    {job.stage && <StageBadge stage={job.stage} size="md" />}
                  </div>
                  {job.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{job.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
