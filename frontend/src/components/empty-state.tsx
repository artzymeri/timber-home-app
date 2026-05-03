'use client';

import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EmptyStateTone = 'default' | 'success' | 'warning' | 'info';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  tone?: EmptyStateTone;
  /** Render compactly inside a card panel rather than full padding */
  compact?: boolean;
}

const TONE_RING: Record<EmptyStateTone, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
};

const DEFAULT_ICONS: Record<EmptyStateTone, LucideIcon> = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  tone = 'default',
  compact,
}: EmptyStateProps) {
  const Icon = icon ?? DEFAULT_ICONS[tone];
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center',
        compact ? 'py-6' : 'rounded-lg border border-dashed bg-card/50 p-10',
        className
      )}
    >
      <div className="relative">
        {tone === 'success' && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-emerald-500/30 dark:bg-emerald-400/20 animate-ping"
          />
        )}
        <div
          className={cn(
            'relative flex h-12 w-12 items-center justify-center rounded-full',
            TONE_RING[tone],
            tone === 'success' && 'animate-pulse'
          )}
        >
          <Icon size={20} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-muted-foreground max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
