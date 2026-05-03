'use client';

import { useEffect, useState } from 'react';
import { Cog } from 'lucide-react';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { MachineryBlueprintCard, type Machine } from '@/components/machinery-blueprint-card';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';

export default function AdminMachineryPage() {
  const { t } = useI18n();
  const [machines, setMachines] = useState<Machine[] | null>(null);

  useEffect(() => {
    api<{ machinery: Machine[] }>('/api/machinery')
      .then((d) => setMachines(d.machinery || []))
      .catch(() => setMachines([]));
  }, []);

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        <PageHeader title={t('machinery')} description={t('machinery_subtitle')} />

        {machines === null ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : machines.length === 0 ? (
          <EmptyState tone="info" icon={Cog} title={t('machinery_no_results')} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {machines.map((m) => (
              <MachineryBlueprintCard key={m.id} machine={m} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
