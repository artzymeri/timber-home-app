'use client';

import { Badge } from '@/components/ui/badge';
import { resolveIcon } from '@/lib/icon-resolver';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export interface RoleCardData {
  id: number;
  role_name: string;
  icon: string;
  description?: string | null;
  permissions: string[];
  is_system: boolean;
  user_count?: number;
}

interface RoleCardProps {
  role: RoleCardData;
  selected?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function RoleCard({ role, selected, onClick, className }: RoleCardProps) {
  const { t } = useI18n();
  const Icon = resolveIcon(role.icon);
  const userCount = role.user_count;
  const userLabel =
    userCount === undefined
      ? null
      : userCount === 0
      ? t('roles_user_count_zero')
      : userCount === 1
      ? t('roles_user_count_one')
      : t('roles_user_count').replace('{count}', String(userCount));

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors',
        selected
          ? 'border-primary ring-2 ring-primary/20'
          : 'hover:border-foreground/20 hover:bg-accent/40',
        className
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon size={20} />
        </div>
        {role.is_system && (
          <Badge variant="secondary" className="text-[10px]">{t('roles_system_badge')}</Badge>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold leading-tight">{role.role_name}</h3>
        {role.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>
        )}
      </div>
      <div className="mt-auto flex w-full items-center justify-between text-xs text-muted-foreground">
        <span>{role.permissions.length} permissions</span>
        {userLabel && <span>{userLabel}</span>}
      </div>
    </button>
  );
}
