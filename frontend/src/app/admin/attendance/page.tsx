'use client';

import { useEffect, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Clock, LogIn, LogOut, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/empty-state';
import { useDataTable } from '@/lib/use-data-table';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AttendanceRow {
  id: number;
  user_id: number;
  user_name: string;
  type: 'check_in' | 'check_out';
  is_within_radius: boolean | number;
  created_at: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

const formatTime = (iso: string): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function AttendancePage() {
  const { t } = useI18n();
  const table = useDataTable<AttendanceRow>({
    endpoint: '/api/attendance/all',
    initial: { sort: 'created_at', order: 'desc' },
  });

  // Pull a small unpaginated payload for KPI math (today's totals).
  const [stats, setStats] = useState<{ checked_in: number; checked_out: number; outside: number } | null>(null);
  useEffect(() => {
    api<{ records: AttendanceRow[] }>('/api/attendance/all')
      .then(({ records }) => {
        const checked_in = records.filter((r) => r.type === 'check_in').length;
        const checked_out = records.filter((r) => r.type === 'check_out').length;
        const outside = records.filter((r) => !Number(r.is_within_radius)).length;
        setStats({ checked_in, checked_out, outside });
      })
      .catch(() => {
        setStats({ checked_in: 0, checked_out: 0, outside: 0 });
      });
  }, []);

  const columns: ColumnDef<AttendanceRow, any>[] = [
    {
      id: 'user_name',
      header: t('attendance_user'),
      enableSorting: false,
      cell: ({ row }) => <span className="font-medium">{row.original.user_name}</span>,
    },
    {
      id: 'type',
      header: t('attendance_type'),
      cell: ({ row }) => {
        const isIn = row.original.type === 'check_in';
        return (
          <Badge
            variant="secondary"
            className={cn(
              isIn
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-stone-200 text-stone-700 dark:bg-stone-500/15 dark:text-stone-300'
            )}
          >
            {isIn ? t('attendance_check_in_label') : t('attendance_check_out_label')}
          </Badge>
        );
      },
    },
    {
      id: 'created_at',
      header: t('attendance_time'),
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatTime(row.original.created_at)}</span>,
    },
    {
      id: 'is_within_radius',
      header: t('attendance_within_radius'),
      enableSorting: false,
      cell: ({ row }) => {
        const inside = !!Number(row.original.is_within_radius);
        return (
          <Badge
            variant="secondary"
            className={cn(
              inside
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
            )}
          >
            {inside ? t('attendance_inside') : t('attendance_outside')}
          </Badge>
        );
      },
    },
  ];

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        <PageHeader title={t('attendance_title')} description={t('attendance_subtitle')} />

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            icon={LogIn}
            label={t('attendance_check_in_label')}
            value={stats?.checked_in ?? '—'}
            tone="emerald"
            loading={stats === null}
          />
          <MetricCard
            icon={LogOut}
            label={t('attendance_check_out_label')}
            value={stats?.checked_out ?? '—'}
            tone="default"
            loading={stats === null}
          />
          <MetricCard
            icon={MapPin}
            label={t('attendance_outside')}
            value={stats?.outside ?? '—'}
            tone={stats && stats.outside > 0 ? 'amber' : 'default'}
            loading={stats === null}
          />
        </div>

        <DataTable
          columns={columns}
          data={table.data}
          total={table.total}
          loading={table.loading}
          state={table.state}
          onSearch={table.setSearch}
          onSort={table.setSort}
          onFilter={table.setFilter}
          onClearFilter={table.clearFilter}
          onPageChange={table.setPage}
          onLimitChange={table.setLimit}
          toolbar={{
            searchPlaceholder: t('attendance_user'),
            filters: [
              {
                key: 'type',
                label: t('attendance_type'),
                options: [
                  { value: 'check_in', label: t('attendance_check_in_label') },
                  { value: 'check_out', label: t('attendance_check_out_label') },
                ],
              },
            ],
          }}
          emptyState={<EmptyState tone="info" icon={Clock} title={t('table_empty')} compact />}
          mobileCard={(row) => {
            const isIn = row.type === 'check_in';
            const inside = !!Number(row.is_within_radius);
            return (
              <div className="p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{row.user_name}</p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      isIn
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-stone-200 text-stone-700'
                    )}
                  >
                    {isIn ? t('attendance_check_in_label') : t('attendance_check_out_label')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatTime(row.created_at)}</span>
                  <span className={inside ? '' : 'text-rose-600 dark:text-rose-400'}>
                    {inside ? t('attendance_inside') : t('attendance_outside')}
                  </span>
                </div>
              </div>
            );
          }}
        />
      </div>
    </PageContainer>
  );
}
