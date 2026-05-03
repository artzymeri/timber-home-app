'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MockDataNoticeProps {
  message: string;
  className?: string;
}

/**
 * Visible flag for surfaces that still render mock data while a real API is wired up.
 * Renders as a thin inline banner so it isn't hidden in code reviews.
 */
export function MockDataNotice({ message, className }: MockDataNoticeProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200',
        className
      )}
    >
      <Info size={12} />
      <span>{message}</span>
    </div>
  );
}
