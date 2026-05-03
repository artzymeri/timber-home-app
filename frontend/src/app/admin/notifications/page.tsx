'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/empty-state';
import { useDataTable } from '@/lib/use-data-table';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface NotificationRow {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean | number;
  created_at: string;
}

const TYPE_TONE: Record<NotificationRow['type'], string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  error: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
};

const formatRelative = (iso: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
};

export default function NotificationsPage() {
  const { t } = useI18n();
  const table = useDataTable<NotificationRow>({
    endpoint: '/api/notifications',
    initial: { sort: 'created_at', order: 'desc' },
  });

  const markAllRead = async () => {
    try {
      await api('/api/notifications/read-all', { method: 'PATCH' });
      toast.success(t('mark_all_read'));
      table.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const markRead = async (id: number) => {
    try {
      await api(`/api/notifications/${id}/read`, { method: 'PATCH' });
      table.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const columns: ColumnDef<NotificationRow, any>[] = [
    {
      id: 'title',
      header: t('name'),
      enableSorting: false,
      cell: ({ row }) => {
        const isUnread = !Number(row.original.read);
        return (
          <div className="flex items-start gap-2">
            {isUnread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
            <div className="min-w-0">
              <p className={cn('text-sm', isUnread ? 'font-semibold' : 'font-normal')}>{row.original.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{row.original.message}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'type',
      header: t('attendance_type'),
      cell: ({ row }) => (
        <Badge variant="secondary" className={cn(TYPE_TONE[row.original.type] || TYPE_TONE.info)}>
          {row.original.type}
        </Badge>
      ),
    },
    {
      id: 'created_at',
      header: t('date'),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs tabular-nums">{formatRelative(row.original.created_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const isUnread = !Number(row.original.read);
        return isUnread ? (
          <Button size="sm" variant="ghost" onClick={() => markRead(row.original.id)}>
            <Check size={12} />
            <span className="hidden sm:inline">{t('notifications_mark_read')}</span>
          </Button>
        ) : null;
      },
    },
  ];

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        <PageHeader
          title={t('notifications_title')}
          description={t('notifications_subtitle')}
          actions={
            <Button variant="outline" onClick={markAllRead}>
              <Check size={14} />
              <span>{t('mark_all_read')}</span>
            </Button>
          }
        />

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
            filters: [
              {
                key: 'read',
                label: t('status'),
                options: [
                  { value: 'false', label: t('notifications_filter_unread') },
                  { value: 'true', label: t('notifications_mark_read') },
                ],
              },
            ],
          }}
          emptyState={
            <EmptyState
              tone="success"
              icon={Bell}
              title={t('notifications_empty')}
              compact
            />
          }
          mobileCard={(row) => {
            const isUnread = !Number(row.read);
            return (
              <div className="p-3 space-y-1.5">
                <div className="flex items-start gap-2">
                  {isUnread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', isUnread ? 'font-semibold' : 'font-normal')}>{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.message}</p>
                  </div>
                  <Badge variant="secondary" className={cn(TYPE_TONE[row.type] || TYPE_TONE.info)}>
                    {row.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{formatRelative(row.created_at)}</p>
              </div>
            );
          }}
        />
      </div>
    </PageContainer>
  );
}
