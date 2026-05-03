'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckSquare } from 'lucide-react';
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

interface TaskOrder {
  id: number;
  client_name: string;
  address: string;
  notes?: string | null;
  stage_id: number;
  stage?: Stage;
}

const FACTORY_CODES = new Set(['cutting', 'cnc', 'finishing', 'packing']);

export default function FactoryTasks() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<TaskOrder[] | null>(null);

  useEffect(() => {
    api<{ orders: TaskOrder[] }>('/api/orders')
      .then(({ orders }) => setOrders(orders))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  }, []);

  const factoryTasks = (orders ?? []).filter((o) =>
    o.stage && FACTORY_CODES.has(o.stage.code)
  );

  return (
    <PageContainer size="default">
      <div className="space-y-4">
        <PageHeader title={t('factory_tasks_title')} description={t('factory_tasks_subtitle')} />

        {orders === null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : factoryTasks.length === 0 ? (
          <EmptyState tone="success" icon={CheckSquare} title={t('factory_tasks_empty')} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {factoryTasks.map((task) => (
              <Link key={task.id} href={`/factory/tasks/${task.id}`}>
                <Card className="hover:shadow-md transition-shadow active:scale-[0.99]">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-base font-semibold">#{task.id} · {task.client_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.address}</p>
                      </div>
                      {task.stage && <StageBadge stage={task.stage} />}
                    </div>
                    {task.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.notes}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
