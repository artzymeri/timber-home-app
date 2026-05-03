'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from '@/lib/api';

export interface DataTableState {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
  q?: string;
  filters: Record<string, string>;
}

export interface DataTableEnvelope<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
}

export const defaultState: DataTableState = {
  page: 1,
  limit: 25,
  sort: undefined,
  order: undefined,
  q: '',
  filters: {},
};

const buildQuery = (state: DataTableState): string => {
  const params = new URLSearchParams();
  params.set('page', String(state.page));
  params.set('limit', String(state.limit));
  if (state.sort) {
    params.set('sort', state.sort);
    params.set('order', state.order ?? 'asc');
  }
  if (state.q) params.set('q', state.q);
  for (const [k, v] of Object.entries(state.filters)) {
    if (v !== '' && v !== undefined && v !== null) {
      params.set(`filter[${k}]`, String(v));
    }
  }
  return params.toString();
};

interface UseDataTableOptions<T> {
  endpoint: string;
  initial?: Partial<DataTableState>;
  /** Called when the response comes back. Use for derived counts. */
  onLoaded?: (data: DataTableEnvelope<T>) => void;
}

export function useDataTable<T>({ endpoint, initial, onLoaded }: UseDataTableOptions<T>) {
  const [state, setState] = useState<DataTableState>({
    ...defaultState,
    ...initial,
    filters: { ...defaultState.filters, ...(initial?.filters || {}) },
  });
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  const queryString = useMemo(() => buildQuery(state), [state]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}${endpoint}?${queryString}`, {
      credentials: 'include',
      signal: ctrl.signal,
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.message || `Request failed (${r.status})`);
        }
        return r.json() as Promise<DataTableEnvelope<T>>;
      })
      .then((envelope) => {
        if (ctrl.signal.aborted) return;
        setData(envelope.rows || []);
        setTotal(envelope.total || 0);
        onLoadedRef.current?.(envelope);
      })
      .catch((e) => {
        if (e?.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Error');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [endpoint, queryString, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Helpers that callers can use without recomputing the whole state object.
  const setSearch = useCallback(
    (q: string) => setState((s) => ({ ...s, q, page: 1 })),
    []
  );
  const setSort = useCallback(
    (sort: string | undefined, order: 'asc' | 'desc' | undefined) =>
      setState((s) => ({ ...s, sort, order, page: 1 })),
    []
  );
  const setFilter = useCallback(
    (key: string, value: string) =>
      setState((s) => ({ ...s, filters: { ...s.filters, [key]: value }, page: 1 })),
    []
  );
  const clearFilter = useCallback(
    (key: string) =>
      setState((s) => {
        const next = { ...s.filters };
        delete next[key];
        return { ...s, filters: next, page: 1 };
      }),
    []
  );
  const setPage = useCallback((page: number) => setState((s) => ({ ...s, page })), []);
  const setLimit = useCallback(
    (limit: number) => setState((s) => ({ ...s, limit, page: 1 })),
    []
  );

  return {
    data,
    total,
    loading,
    error,
    state,
    setState,
    setSearch,
    setSort,
    setFilter,
    clearFilter,
    setPage,
    setLimit,
    refresh,
  };
}
