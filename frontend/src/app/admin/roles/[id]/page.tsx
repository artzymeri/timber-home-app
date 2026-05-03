'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { RoleForm, RoleFormInitial } from '@/components/role-form';
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

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [role, setRole] = useState<(RoleFormInitial & { user_count?: number }) | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api<{ role: any }>(`/api/roles/${id}`)
      .then(({ role }) => setRole(role))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  }, [id]);

  const remove = async () => {
    setDeleting(true);
    try {
      await api(`/api/roles/${id}`, { method: 'DELETE' });
      toast.success(t('roles_delete'));
      router.push('/admin/roles');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (!role) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  const canDelete = !role.is_system && (role.user_count || 0) === 0;

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/roles"
            aria-label="Back"
            className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
          >
            <ChevronLeft size={16} />
          </Link>
          <h2 className="text-xl font-bold tracking-tight">{t('roles_edit')}</h2>
        </div>
        {!role.is_system && (
          <Button
            variant="destructive"
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!canDelete}
            title={!canDelete ? t('roles_delete_blocked') : undefined}
          >
            <Trash2 size={14} />
            <span>{t('roles_delete')}</span>
          </Button>
        )}
      </div>

      <RoleForm mode="edit" initial={role} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('roles_delete')}</DialogTitle>
            <DialogDescription>
              {role.role_name}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={remove} disabled={deleting}>
              {deleting ? '…' : t('roles_delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageContainer>
  );
}
