'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { buttonVariants } from '@/components/ui/button';
import { StageForm } from '@/components/stage-form';
import { PageContainer } from '@/components/page-container';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { StageNode } from '@/lib/stages';

export default function NewStagePage() {
  const { t } = useI18n();
  const [tree, setTree] = useState<StageNode[] | null>(null);

  useEffect(() => {
    api<{ tree: StageNode[] }>('/api/stages')
      .then(({ tree }) => setTree(tree))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  }, []);

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/stages"
            aria-label="Back"
            className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
          >
            <ChevronLeft size={16} />
          </Link>
          <h2 className="text-xl font-bold tracking-tight">{t('stages_create')}</h2>
        </div>
        {tree === null ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : (
          <StageForm mode="create" tree={tree} />
        )}
      </div>
    </PageContainer>
  );
}
