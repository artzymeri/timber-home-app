import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MachineryErrorPayload {
  count: number;
  machines: { id: number; name: string }[];
}

/**
 * Polled count of machines currently in `error` status.
 * Shared between the bottom-tab badge in `RoleNavigator` and the dashboard
 * alert card — TanStack Query dedupes by key so both consumers hit the API
 * just once.
 */
export function useMachineryErrorCount(enabled = true) {
  const query = useQuery({
    queryKey: ['machinery', 'error-count'],
    queryFn: () => api<MachineryErrorPayload>('/api/machinery/error-count'),
    enabled,
    staleTime: 30_000,
  });
  return {
    count: query.data?.count ?? 0,
    machines: query.data?.machines ?? [],
    refetch: query.refetch,
  };
}
