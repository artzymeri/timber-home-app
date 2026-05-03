'use client';

import { AlertTriangle, Cog, Hammer, Layers, Paintbrush, Scissors, Settings, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import type { TranslationKeys } from '@/lib/i18n/en';
import { cn } from '@/lib/utils';

export interface Machine {
  id: number;
  name: string;
  type: string;
  serial_number: string;
  location: string | null;
  status: 'operational' | 'idle' | 'maintenance' | 'error';
  error_message: string | null;
  last_service_at: string | null;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  'CNC Router': Cog,
  'Panel Saw': Scissors,
  'Edgebander': Layers,
  'Sander': Hammer,
  'Drill Press': Wrench,
  'Finishing Booth': Paintbrush,
};

const STATUS_DOT: Record<Machine['status'], string> = {
  operational: 'bg-emerald-500',
  idle: 'bg-stone-400 dark:bg-stone-500',
  maintenance: 'bg-amber-500',
  error: 'bg-rose-500 animate-pulse',
};

const STATUS_LABEL: Record<Machine['status'], TranslationKeys> = {
  operational: 'machinery_status_operational',
  idle: 'machinery_status_idle',
  maintenance: 'machinery_status_maintenance',
  error: 'machinery_status_error',
};

const STATUS_PILL: Record<Machine['status'], string> = {
  operational: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  idle: 'bg-muted text-muted-foreground',
  maintenance: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  error: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return '—';
  }
};

export function MachineryBlueprintCard({ machine }: { machine: Machine }) {
  const { t } = useI18n();
  const Icon = TYPE_ICON[machine.type] || Settings;
  const isError = machine.status === 'error';

  return (
    <Card className={cn(isError && 'border-rose-300/60 dark:border-rose-500/40')}>
      <CardContent className="p-5">
        {/* Header: type icon + status indicator */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon size={14} />
            <p className="text-xs font-medium uppercase tracking-wide">{machine.type}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[machine.status])} />
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                STATUS_PILL[machine.status]
              )}
            >
              {t(STATUS_LABEL[machine.status])}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="mt-3">
          <h3 className="text-base font-semibold text-foreground">{machine.name}</h3>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">SN · {machine.serial_number}</p>
          {machine.location && (
            <p className="mt-0.5 text-xs text-muted-foreground">{machine.location}</p>
          )}
        </div>

        {/* Footer: last service */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {t('machinery_last_service')}
          </span>
          <span className="text-xs tabular-nums text-foreground/80">{formatDate(machine.last_service_at)}</span>
        </div>

        {/* Error ribbon */}
        {isError && machine.error_message && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 dark:border-rose-500/30 dark:bg-rose-500/5">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">{machine.error_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
