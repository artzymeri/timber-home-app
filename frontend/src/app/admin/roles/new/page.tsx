'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { RoleForm } from '@/components/role-form';
import { PageContainer } from '@/components/page-container';
import { useI18n } from '@/lib/i18n';

export default function NewRolePage() {
  const { t } = useI18n();
  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/roles"
            aria-label="Back"
            className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
          >
            <ChevronLeft size={16} />
          </Link>
          <h2 className="text-xl font-bold tracking-tight">{t('roles_create')}</h2>
        </div>
        <RoleForm mode="create" />
      </div>
    </PageContainer>
  );
}
