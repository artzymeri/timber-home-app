import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AttendanceRecord {
  id: number;
  type: 'check_in' | 'check_out';
  created_at: string;
  is_within_radius: boolean | null;
}

interface TodayPayload {
  records?: AttendanceRecord[];
}

export function useTodayAttendance(enabled: boolean) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => api<TodayPayload>('/api/attendance/today'),
    enabled,
    staleTime: 60_000,
  });

  // Refetch when the app comes back to the foreground (handles day rollover).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') qc.invalidateQueries({ queryKey: ['attendance', 'today'] });
    });
    return () => sub.remove();
  }, [qc]);

  const checkIn = useMutation({
    mutationFn: () => api('/api/attendance/check-in', { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance', 'today'] }),
  });

  // The backend returns every event for today; the gate is satisfied as soon
  // as there's a `check_in` row.
  const records = query.data?.records ?? [];
  const checkedIn = records.find((r) => r.type === 'check_in') ?? null;

  return {
    attendance: checkedIn,
    loading: query.isLoading,
    refetch: query.refetch,
    checkIn,
  };
}
