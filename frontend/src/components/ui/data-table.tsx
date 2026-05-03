'use client';

import { useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n';
import type { DataTableState } from '@/lib/use-data-table';
import { cn } from '@/lib/utils';

export interface DataTableFilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T extends { id: number | string }> {
  columns: ColumnDef<T, any>[];
  data: T[];
  total: number;
  loading?: boolean;
  state: DataTableState;
  onSearch: (q: string) => void;
  onSort: (sort: string | undefined, order: 'asc' | 'desc' | undefined) => void;
  onFilter: (key: string, value: string) => void;
  onClearFilter: (key: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  toolbar?: {
    searchPlaceholder?: string;
    filters?: DataTableFilterDef[];
    actions?: ReactNode;
  };
  rowSelection?: {
    enabled: boolean;
    onChange?: (ids: Array<number | string>) => void;
    actions?: (selectedIds: Array<number | string>) => ReactNode;
  };
  mobileCard?: (row: T) => ReactNode;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
}

const useDebounced = (value: string, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  total,
  loading,
  state,
  onSearch,
  onSort,
  onFilter,
  onClearFilter,
  onPageChange,
  onLimitChange,
  toolbar,
  rowSelection,
  mobileCard,
  emptyState,
  onRowClick,
}: DataTableProps<T>) {
  const { t } = useI18n();
  const [searchInput, setSearchInput] = useState(state.q || '');
  const debouncedSearch = useDebounced(searchInput, 300);
  useEffect(() => {
    if ((state.q || '') !== debouncedSearch) {
      onSearch(debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const [rowSelectionState, setRowSelectionState] = useState<RowSelectionState>({});
  const finalColumns = useMemo<ColumnDef<T, any>[]>(() => {
    if (!rowSelection?.enabled) return columns;
    const checkboxCol: ColumnDef<T, any> = {
      id: '__select',
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
    };
    return [checkboxCol, ...columns];
  }, [columns, rowSelection?.enabled]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(1, state.limit))),
    enableRowSelection: !!rowSelection?.enabled,
    onRowSelectionChange: setRowSelectionState,
    state: {
      rowSelection: rowSelectionState,
    },
    getRowId: (row) => String(row.id),
  });

  // Notify caller about selection changes
  useEffect(() => {
    if (!rowSelection?.enabled) return;
    const ids = Object.keys(rowSelectionState).filter((k) => rowSelectionState[k]);
    rowSelection.onChange?.(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelectionState]);

  const handleHeaderClick = useCallback(
    (columnId: string) => {
      if (state.sort === columnId) {
        if (state.order === 'asc') onSort(columnId, 'desc');
        else if (state.order === 'desc') onSort(undefined, undefined);
        else onSort(columnId, 'asc');
      } else {
        onSort(columnId, 'asc');
      }
    },
    [state.sort, state.order, onSort]
  );

  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, state.limit)));
  const fromRow = total === 0 ? 0 : (state.page - 1) * state.limit + 1;
  const toRow = Math.min(total, state.page * state.limit);

  const selectedIds = useMemo(
    () => Object.keys(rowSelectionState).filter((k) => rowSelectionState[k]),
    [rowSelectionState]
  );

  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {toolbar?.searchPlaceholder !== undefined && (
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={toolbar.searchPlaceholder}
                className="pl-8"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
          {toolbar?.filters?.map((f) => {
            const active = state.filters[f.key];
            return (
              <div key={f.key} className="flex items-center gap-1">
                <Select
                  value={active ?? ''}
                  onValueChange={(v) => onFilter(f.key, v as string)}
                >
                  <SelectTrigger className="h-8 min-w-32">
                    <SelectValue placeholder={f.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {active && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => onClearFilter(f.key)}
                    aria-label={t('table_clear')}
                  >
                    <X size={12} />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {rowSelection?.enabled && selectedIds.length > 0 && rowSelection.actions && (
            <div className="flex items-center gap-2 rounded-md border bg-accent/40 px-2 py-1 text-xs">
              <span className="font-medium">{t('table_selected').replace('{n}', String(selectedIds.length))}</span>
              {rowSelection.actions(selectedIds)}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" type="button">
                  <Columns3 size={14} />
                  <span className="hidden sm:inline">{t('table_columns')}</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {table
                .getAllLeafColumns()
                .filter((c) => c.id !== '__select')
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) => column.toggleVisibility(!!v)}
                  >
                    {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {toolbar?.actions}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b">
                {hg.headers.map((header) => {
                  const colDef = header.column.columnDef;
                  const sortable = colDef.enableSorting !== false && header.column.id !== '__select';
                  const isSorted = state.sort === header.column.id ? state.order : undefined;
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'px-3 py-2 text-left text-xs font-medium text-muted-foreground',
                        sortable && 'cursor-pointer select-none hover:text-foreground'
                      )}
                      onClick={sortable ? () => handleHeaderClick(header.column.id) : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(colDef.header, header.getContext())}
                        {sortable && (
                          isSorted === 'asc' ? <ArrowUp size={12} /> :
                          isSorted === 'desc' ? <ArrowDown size={12} /> :
                          <ArrowUpDown size={12} className="opacity-30" />
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              [0, 1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-b last:border-0">
                  {Array.from({ length: visibleColumnCount }).map((_, j) => (
                    <td key={j} className="px-3 py-2">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnCount} className="px-3 py-10">
                  {emptyState ?? (
                    <p className="text-center text-sm text-muted-foreground">{t('table_empty')}</p>
                  )}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b last:border-0 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-accent/40',
                    row.getIsSelected() && 'bg-accent/30'
                  )}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-slot="checkbox"]')) return;
                    onRowClick?.(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : data.length === 0 ? (
          emptyState ?? (
            <div className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">
              {t('table_empty')}
            </div>
          )
        ) : mobileCard ? (
          data.map((row) => (
            <div
              key={String(row.id)}
              className={cn('rounded-md border bg-card', onRowClick && 'cursor-pointer hover:bg-accent/40')}
              onClick={() => onRowClick?.(row)}
            >
              {mobileCard(row)}
            </div>
          ))
        ) : (
          <div className="overflow-x-auto rounded-md border bg-card">
            <table className="w-full text-sm">
              <tbody>
                {data.map((row) => (
                  <tr key={String(row.id)} className="border-b last:border-0">
                    <td className="p-3">
                      <pre className="text-xs">{JSON.stringify(row, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {t('table_showing')
            .replace('{from}', String(fromRow))
            .replace('{to}', String(toRow))
            .replace('{total}', String(total))}
        </p>
        <div className="flex items-center gap-2">
          <Select value={String(state.limit)} onValueChange={(v) => onLimitChange(Number(v))}>
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(1)}
            disabled={state.page <= 1}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(state.page - 1)}
            disabled={state.page <= 1}
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums px-2">
            {state.page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(state.page + 1)}
            disabled={state.page >= totalPages}
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(totalPages)}
            disabled={state.page >= totalPages}
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
