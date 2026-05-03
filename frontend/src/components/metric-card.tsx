'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedNumber } from '@/components/animated-number';
import { cn } from '@/lib/utils';

export type MetricTone = 'default' | 'amber' | 'emerald' | 'rose' | 'violet' | 'blue';

interface ToneStyles {
  iconBg: string;
  iconFg: string;
  blob: string;
  accent: string;
  hoverBorder: string;
}

const TONE: Record<MetricTone, ToneStyles> = {
  default: {
    iconBg: 'bg-sky-500/15',
    iconFg: 'text-sky-600 dark:text-sky-300',
    blob: 'bg-sky-500/20',
    accent: 'from-sky-500/0 via-sky-500/60 to-sky-500/0',
    hoverBorder: 'group-hover/m:border-sky-500/30',
  },
  amber: {
    iconBg: 'bg-amber-500/15',
    iconFg: 'text-amber-600 dark:text-amber-300',
    blob: 'bg-amber-500/20',
    accent: 'from-amber-500/0 via-amber-500/60 to-amber-500/0',
    hoverBorder: 'group-hover/m:border-amber-500/30',
  },
  emerald: {
    iconBg: 'bg-emerald-500/15',
    iconFg: 'text-emerald-600 dark:text-emerald-300',
    blob: 'bg-emerald-500/20',
    accent: 'from-emerald-500/0 via-emerald-500/60 to-emerald-500/0',
    hoverBorder: 'group-hover/m:border-emerald-500/30',
  },
  rose: {
    iconBg: 'bg-rose-500/15',
    iconFg: 'text-rose-600 dark:text-rose-300',
    blob: 'bg-rose-500/20',
    accent: 'from-rose-500/0 via-rose-500/60 to-rose-500/0',
    hoverBorder: 'group-hover/m:border-rose-500/30',
  },
  violet: {
    iconBg: 'bg-violet-500/15',
    iconFg: 'text-violet-600 dark:text-violet-300',
    blob: 'bg-violet-500/20',
    accent: 'from-violet-500/0 via-violet-500/60 to-violet-500/0',
    hoverBorder: 'group-hover/m:border-violet-500/30',
  },
  blue: {
    iconBg: 'bg-blue-500/15',
    iconFg: 'text-blue-600 dark:text-blue-300',
    blob: 'bg-blue-500/20',
    accent: 'from-blue-500/0 via-blue-500/60 to-blue-500/0',
    hoverBorder: 'group-hover/m:border-blue-500/30',
  },
};

export interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  /** Optional formatter when value is numeric (animated count-up). */
  format?: (n: number) => string;
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
  format,
  hint,
  href,
  tone = 'default',
  loading,
  trend,
}: MetricCardProps) {
  const styles = TONE[tone];

  const Body = (
    <Card
      className={cn(
        'group/m relative h-full overflow-hidden transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lg',
        styles.hoverBorder
      )}
    >
      {/* Top accent bar — appears on hover */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover/m:opacity-100',
          styles.accent
        )}
      />
      {/* Decorative blob in the top-right */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-60 transition-opacity duration-300 group-hover/m:opacity-100',
          styles.blob
        )}
      />

      <CardContent className="relative pt-5">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/5 transition-transform duration-300 group-hover/m:scale-110',
              styles.iconBg
            )}
          >
            <Icon size={20} className={styles.iconFg} />
          </div>
          {href && (
            <ArrowRight
              size={14}
              className="mt-2 text-muted-foreground opacity-0 -translate-x-1 transition-all duration-300 group-hover/m:translate-x-0 group-hover/m:opacity-100"
            />
          )}
        </div>

        <div className="mt-5">
          {loading ? (
            <Skeleton className="h-9 w-32" />
          ) : typeof value === 'number' ? (
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              <AnimatedNumber value={value} format={format} />
            </p>
          ) : (
            <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
          )}
          <p className="mt-1.5 text-sm font-medium text-foreground/85">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
          {trend && !loading && (
            <span
              className={cn(
                'mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                trend.direction === 'up' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                trend.direction === 'down' && 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
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

  return href ? (
    <Link href={href} className="block">
      {Body}
    </Link>
  ) : (
    <div>{Body}</div>
  );
}
