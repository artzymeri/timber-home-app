'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Package, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/empty-state';
import { useDataTable } from '@/lib/use-data-table';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface InventoryRow {
  id: number;
  name: string;
  category?: string | null;
  quantity: number;
  reorder_level: number;
  unit?: string | null;
  cost_per_unit?: number | string | null;
}

const formatMoney = (n: number | string | null | undefined): string => {
  const v = typeof n === 'string' ? parseFloat(n) : n || 0;
  return `€${v.toFixed(2)}`;
};

const initialForm = {
  name: '',
  category: '',
  brand: '',
  unit: 'pcs',
  quantity: '',
  reorder_level: '',
  cost_per_unit: '',
};

export default function InventoryPage() {
  const { t } = useI18n();
  const table = useDataTable<InventoryRow>({
    endpoint: '/api/inventory',
    initial: { sort: 'name', order: 'asc' },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(initialForm);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          // Brand is appended to category since the table has no `brand` column.
          category: form.brand.trim()
            ? `${form.category.trim()} · ${form.brand.trim()}`
            : form.category.trim(),
          unit: form.unit.trim() || 'pcs',
          quantity: form.quantity ? Number(form.quantity) : 0,
          reorder_level: form.reorder_level ? Number(form.reorder_level) : 10,
          cost_per_unit: form.cost_per_unit !== '' ? Number(form.cost_per_unit) : null,
        }),
      });
      toast.success(t('inventory_created'));
      setCreateOpen(false);
      setForm(initialForm);
      table.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setCreating(false);
    }
  };

  const columns: ColumnDef<InventoryRow, any>[] = [
    {
      id: 'name',
      header: t('material'),
      accessorKey: 'name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: 'category',
      header: t('category'),
      accessorKey: 'category',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.category ?? '—'}</span>
      ),
    },
    {
      id: 'quantity',
      header: t('inventory_qty'),
      accessorKey: 'quantity',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <span className="tabular-nums">
            {r.quantity}
            {r.unit ? <span className="text-muted-foreground ml-1">{r.unit}</span> : null}
          </span>
        );
      },
    },
    {
      id: 'reorder_level',
      header: t('low_stock'),
      accessorKey: 'reorder_level',
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">{row.original.reorder_level}</span>
      ),
    },
    {
      id: 'cost_per_unit',
      header: t('inventory_unit_cost'),
      accessorKey: 'cost_per_unit',
      cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.cost_per_unit)}</span>,
    },
    {
      id: 'status',
      header: t('status'),
      enableSorting: false,
      cell: ({ row }) => {
        const isLow = row.original.quantity <= row.original.reorder_level;
        return (
          <Badge
            variant="secondary"
            className={cn(
              isLow
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
            )}
          >
            {isLow ? t('inventory_status_low') : t('inventory_status_ok')}
          </Badge>
        );
      },
    },
  ];

  return (
    <PageContainer size="wide">
      <div className="space-y-6">
        <PageHeader
          title={t('inventory_title')}
          description={t('inventory_subtitle')}
          actions={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={14} />
              <span>{t('inventory_create')}</span>
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
            searchPlaceholder: t('inventory_search_placeholder'),
            filters: [
              {
                key: 'low_stock',
                label: t('inventory_filter_low_stock'),
                options: [{ value: 'true', label: t('inventory_status_low') }],
              },
            ],
          }}
          emptyState={
            <EmptyState
              tone="info"
              icon={Package}
              title={t('table_empty')}
              description={t('inventory_subtitle')}
              compact
            />
          }
          mobileCard={(row) => {
            const isLow = row.quantity <= row.reorder_level;
            return (
              <div className="p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{row.name}</p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      isLow
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    )}
                  >
                    {isLow ? t('inventory_status_low') : t('inventory_status_ok')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{row.category ?? '—'}</p>
                <div className="flex items-center justify-between text-xs">
                  <span>
                    {row.quantity} / {row.reorder_level} {row.unit ?? ''}
                  </span>
                  <span className="tabular-nums">{formatMoney(row.cost_per_unit)}</span>
                </div>
              </div>
            );
          }}
        />
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle>{t('inventory_add_title')}</SheetTitle>
            <SheetDescription>{t('inventory_add_subtitle')}</SheetDescription>
          </SheetHeader>
          <form onSubmit={submit} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-4">
              <div className="space-y-2">
                <Label htmlFor="inv-name">{t('inventory_name')}</Label>
                <Input
                  id="inv-name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder={t('inventory_name_placeholder')}
                  required
                  maxLength={200}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="inv-category">{t('category')}</Label>
                  <Input
                    id="inv-category"
                    value={form.category}
                    onChange={(e) => setField('category', e.target.value)}
                    placeholder={t('inventory_category_placeholder')}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-brand">{t('inventory_brand')}</Label>
                  <Input
                    id="inv-brand"
                    value={form.brand}
                    onChange={(e) => setField('brand', e.target.value)}
                    placeholder={t('inventory_brand_placeholder')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="inv-unit">{t('inventory_unit')}</Label>
                  <Input
                    id="inv-unit"
                    value={form.unit}
                    onChange={(e) => setField('unit', e.target.value)}
                    placeholder={t('inventory_unit_placeholder')}
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-qty">{t('inventory_qty')}</Label>
                  <Input
                    id="inv-qty"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setField('quantity', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="inv-reorder">{t('inventory_reorder_level')}</Label>
                  <Input
                    id="inv-reorder"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.reorder_level}
                    onChange={(e) => setField('reorder_level', e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-cost">{t('inventory_unit_cost')}</Label>
                  <Input
                    id="inv-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost_per_unit}
                    onChange={(e) => setField('cost_per_unit', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <SheetFooter className="flex-row justify-end border-t">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? '…' : t('inventory_save')}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
