'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ClipboardList, Sparkles } from 'lucide-react';
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
import { TranslationKeys } from '@/lib/i18n/en';

interface POrow {
  id: number;
  inventory_id: number;
  item_name: string;
  unit?: string | null;
  quantity: number;
  unit_cost: number | string;
  total_cost: number | string;
  status: 'suggested' | 'pending_approval' | 'approved' | 'ordered' | 'received';
  created_at: string;
  approved_by_name?: string | null;
}

const STATUS_KEYS: Record<POrow['status'], TranslationKeys> = {
  suggested: 'po_status_suggested',
  pending_approval: 'po_status_pending_approval',
  approved: 'po_status_approved',
  ordered: 'po_status_ordered',
  received: 'po_status_received',
};

const STATUS_TONE: Record<POrow['status'], string> = {
  suggested: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  pending_approval: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  ordered: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  received: 'bg-stone-200 text-stone-700 dark:bg-stone-500/15 dark:text-stone-300',
};

const formatMoney = (n: number | string | null | undefined): string => {
  const v = typeof n === 'string' ? parseFloat(n) : n || 0;
  return `€${v.toFixed(2)}`;
};

export default function PurchaseOrdersPage() {
  const { t } = useI18n();
  const table = useDataTable<POrow>({
    endpoint: '/api/purchase-orders',
    initial: { sort: 'created_at', order: 'desc' },
  });
  const [generating, setGenerating] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selected, setSelected] = useState<Array<number | string>>([]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await api<{ created: number; message: string }>('/api/purchase-orders/auto-generate', { method: 'POST' });
      toast.success(res.message);
      table.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setGenerating(false);
    }
  };

  const approveSelected = async (ids: Array<number | string>) => {
    setBulkBusy(true);
    try {
      await Promise.all(ids.map((id) => api(`/api/purchase-orders/${id}/approve`, { method: 'PATCH' })));
      toast.success(t('po_status_approved'));
      table.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBulkBusy(false);
    }
  };

  const columns: ColumnDef<POrow, any>[] = [
    {
      id: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs">#{row.original.id}</span>,
    },
    {
      id: 'item_name',
      header: t('material'),
      enableSorting: false,
      cell: ({ row }) => <span className="font-medium">{row.original.item_name}</span>,
    },
    {
      id: 'quantity',
      header: t('po_qty'),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.quantity}
          {row.original.unit && <span className="text-muted-foreground ml-1">{row.original.unit}</span>}
        </span>
      ),
    },
    {
      id: 'total_cost',
      header: t('po_total'),
      cell: ({ row }) => <span className="font-semibold tabular-nums">{formatMoney(row.original.total_cost)}</span>,
    },
    {
      id: 'status',
      header: t('status'),
      cell: ({ row }) => (
        <Badge variant="secondary" className={cn(STATUS_TONE[row.original.status])}>
          {t(STATUS_KEYS[row.original.status])}
        </Badge>
      ),
    },
    {
      id: 'approved_by_name',
      header: t('po_approved_by'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.approved_by_name ?? '—'}</span>
      ),
    },
    {
      id: 'created_at',
      header: t('date'),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        <PageHeader
          title={t('po_title')}
          description={t('po_subtitle')}
          actions={
            <Button onClick={generate} disabled={generating}>
              <Sparkles size={14} />
              <span>{t('po_auto_generate')}</span>
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
          rowSelection={{
            enabled: true,
            onChange: setSelected,
            actions: (ids) => (
              <Button
                size="sm"
                variant="default"
                onClick={() => approveSelected(ids)}
                disabled={bulkBusy}
              >
                {t('po_approve_selected')}
              </Button>
            ),
          }}
          toolbar={{
            filters: [
              {
                key: 'status',
                label: t('status'),
                options: (Object.keys(STATUS_KEYS) as POrow['status'][]).map((s) => ({
                  value: s,
                  label: t(STATUS_KEYS[s]),
                })),
              },
            ],
          }}
          emptyState={<EmptyState tone="info" icon={ClipboardList} title={t('po_no_pending')} compact />}
          mobileCard={(row) => (
            <div className="p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{row.item_name}</p>
                <Badge variant="secondary" className={cn(STATUS_TONE[row.status])}>
                  {t(STATUS_KEYS[row.status])}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  #{row.id} · {row.quantity} {row.unit ?? ''}
                </span>
                <span className="font-semibold text-foreground tabular-nums">{formatMoney(row.total_cost)}</span>
              </div>
            </div>
          )}
        />
        {/* Selected ids tracked: {selected.length} */}
        <span className="hidden">{selected.length}</span>
      </div>
    </PageContainer>
  );
}
