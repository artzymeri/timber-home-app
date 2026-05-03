'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { buttonVariants } from '@/components/ui/button';
import { RoleCard, RoleCardData } from '@/components/role-card';
import { EmptyState } from '@/components/empty-state';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';

export default function RolesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [roles, setRoles] = useState<RoleCardData[] | null>(null);

  useEffect(() => {
    api<{ roles: RoleCardData[] }>('/api/roles')
      .then(({ roles }) => setRoles(roles))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'));
  }, []);

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
      <PageHeader
        title={t('roles_title')}
        description={t('roles_subtitle')}
        actions={
          <Link href="/admin/roles/new" className={buttonVariants()}>
            <Plus size={14} />
            <span>{t('roles_create')}</span>
          </Link>
        }
      />

      {roles === null ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : roles.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={t('roles_empty')}
          action={
            <Link href="/admin/roles/new" className={buttonVariants()}>
              <Plus size={14} />
              <span>{t('roles_create')}</span>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onClick={() => router.push(`/admin/roles/${role.id}`)}
            />
          ))}
        </div>
      )}
      </div>
    </PageContainer>
  );
}
