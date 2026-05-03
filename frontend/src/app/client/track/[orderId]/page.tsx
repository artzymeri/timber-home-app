'use client';

import { use, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { API_BASE } from '@/lib/api';
import { resolveIcon } from '@/lib/icon-resolver';
import { stageDisplayName, type Stage } from '@/lib/stages';
import { cn } from '@/lib/utils';

interface PublicOrderResponse {
  order: {
    id: number;
    client_name: string;
    created_at: string;
    updated_at: string;
    stage: Stage;
  };
  stages: Stage[];
}

export default function ClientTrackPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { t } = useI18n();
  const [data, setData] = useState<PublicOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/orders/public/${orderId}`)
      .then(async (r) => {
        if (!r.ok) {
          setError('Order not found');
          return;
        }
        const json = (await r.json()) as PublicOrderResponse;
        setData(json);
      })
      .catch(() => setError('Network error'));
  }, [orderId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        {t('loading')}
      </div>
    );
  }

  const { order, stages } = data;
  // Render only top-level stages on the public timeline (parents act as section
  // headers; children of the active parent expand inline below).
  const topLevel = stages.filter((s) => !s.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const currentIdx = topLevel.findIndex((s) => {
    if (s.id === order.stage.id) return true;
    // Active parent: its child is current.
    return stages.some((c) => c.parent_id === s.id && c.id === order.stage.id);
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">{t('app_name')}</h1>
        <p className="text-muted-foreground">{t('order_tracking')}</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('order')} #{order.id}</CardTitle>
            <Badge>{stageDisplayName(order.stage, t)}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            {topLevel.map((stage, i) => {
              const Icon = resolveIcon(stage.icon);
              const status: 'past' | 'active' | 'upcoming' =
                i < currentIdx ? 'past' : i === currentIdx ? 'active' : 'upcoming';
              const isActiveParent = i === currentIdx && stage.id !== order.stage.id;
              return (
                <div key={stage.id}>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full',
                        status === 'past' && 'bg-emerald-500 text-white',
                        status === 'active' && 'bg-primary text-primary-foreground animate-pulse',
                        status === 'upcoming' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon size={12} />
                    </div>
                    <span
                      className={cn(
                        'text-sm',
                        status === 'past' && 'text-muted-foreground line-through',
                        status === 'active' && 'font-semibold',
                        status === 'upcoming' && 'text-muted-foreground'
                      )}
                    >
                      {stageDisplayName(stage, t)}
                    </span>
                    {status === 'active' && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        {t('current_stage')}
                      </Badge>
                    )}
                  </div>
                  {/* Active parent: show its children inline */}
                  {isActiveParent && (
                    <div className="ml-10 mt-2 space-y-1">
                      {stages
                        .filter((c) => c.parent_id === stage.id)
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((child) => {
                          const ChildIcon = resolveIcon(child.icon);
                          const isCurrent = child.id === order.stage.id;
                          return (
                            <div key={child.id} className="flex items-center gap-2">
                              <ChildIcon size={11} className={isCurrent ? 'text-primary' : 'text-muted-foreground'} />
                              <span
                                className={cn(
                                  'text-xs',
                                  isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'
                                )}
                              >
                                {stageDisplayName(child, t)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Separator className="my-4" />

          <div className="text-center text-sm text-muted-foreground">
            <p>{t('client_details')}</p>
            <p className="font-medium mt-1">{order.client_name}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
