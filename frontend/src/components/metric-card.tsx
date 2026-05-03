'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type MetricTone = 'default' | 'amber' | 'emerald' | 'rose' | 'violet' | 'blue';

const TONE_CLASS: Record<MetricTone, string> = {
  default: 'bg-primary/10 text-primary',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
};

export interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: MetricTone;
  loading?: boolean;
  trend?: { value: string; direction: 'up' | 'down' | 'flat' };
}

const TrendIcon = ({ direction }: { direction: 'up' | 'down' | 'flat' }) => {
  if (direction === 'up') return <ArrowUpRight size={12} />;
  if (direction === 'down') return <ArrowDownRight size={12} />;
  return <Minus size={12} />;
};

export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  tone = 'default',
  loading,
  trend,
}: MetricCardProps) {
  const Body = (
    <Card className="h-full transition-colors hover:border-foreground/15">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-md', TONE_CLASS[tone])}>
            <Icon size={16} />
          </div>
          {href && (
            <ArrowRight
              size={14}
              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            />
          )}
        </div>
        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
          {hint && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</p>}
          {trend && !loading && (
            <span
              className={cn(
                'mt-2 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium',
                trend.direction === 'up' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
                trend.direction === 'down' && 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
                trend.direction === 'flat' && 'bg-muted text-muted-foreground'
              )}
            >
              <TrendIcon direction={trend.direction} />
              {trend.value}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="group block">{Body}</Link> : <div className="group">{Body}</div>;
}
