'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { StageForm } from '@/components/stage-form';
import { PageContainer } from '@/components/page-container';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { Stage, StageNode } from '@/lib/stages';

export default function EditStagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [stage, setStage] = useState<(Stage & { user_count?: number }) | null>(null);
  const [tree, setTree] = useState<StageNode[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ stage: Stage & { user_count?: number } }>(`/api/stages/${id}`),
      api<{ tree: StageNode[] }>('/api/stages'),
    ])
      .then(([{ stage }, { tree }]) => {
        setStage(stage);
        setTree(tree);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  }, [id]);

  const remove = async () => {
    setDeleting(true);
    try {
      await api(`/api/stages/${id}`, { method: 'DELETE' });
      toast.success(t('stages_delete'));
      router.push('/admin/stages');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (!stage || !tree) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/stages"
            aria-label="Back"
            className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
          >
            <ChevronLeft size={16} />
          </Link>
          <h2 className="text-xl font-bold tracking-tight">{t('stages_edit')}</h2>
        </div>
        {!stage.is_system && (
          <Button variant="destructive" type="button" onClick={() => setConfirmOpen(true)}>
            <Trash2 size={14} />
            <span>{t('stages_delete')}</span>
          </Button>
        )}
      </div>

      <StageForm mode="edit" tree={tree} initial={stage} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('stages_delete')}</DialogTitle>
            <DialogDescription>{stage.name}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={remove} disabled={deleting}>
              {deleting ? '…' : t('stages_delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageContainer>
  );
}
