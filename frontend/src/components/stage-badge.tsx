'use client';

import { resolveIcon } from '@/lib/icon-resolver';
import { colorClasses, stageDisplayName, type Stage } from '@/lib/stages';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface StageBadgeProps {
  stage: Stage;
  size?: 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

export function StageBadge({ stage, size = 'sm', className, showIcon = true }: StageBadgeProps) {
  const { t } = useI18n();
  const Icon = resolveIcon(stage.icon);
  const c = colorClasses(stage.color);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium',
        c.chip,
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        className
      )}
    >
      {showIcon && <Icon size={size === 'sm' ? 11 : 13} />}
      <span>{stageDisplayName(stage, t)}</span>
    </span>
  );
}
