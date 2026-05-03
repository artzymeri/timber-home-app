'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Workflow, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { buttonVariants } from '@/components/ui/button';
import { StageTree } from '@/components/stage-tree';
import { EmptyState } from '@/components/empty-state';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { StageNode } from '@/lib/stages';

export default function StagesPage() {
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
      <PageHeader
        title={t('stages_title')}
        description={t('stages_subtitle')}
        actions={
          <Link href="/admin/stages/new" className={buttonVariants()}>
            <Plus size={14} />
            <span>{t('stages_create')}</span>
          </Link>
        }
      />

      {tree === null ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : tree.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title={t('stages_empty')}
          action={
            <Link href="/admin/stages/new" className={buttonVariants()}>
              <Plus size={14} />
              <span>{t('stages_create')}</span>
            </Link>
          }
        />
      ) : (
        <StageTree tree={tree} />
      )}
      </div>
    </PageContainer>
  );
}
