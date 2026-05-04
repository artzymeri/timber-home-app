import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface NotificationRow {
  id: number;
  read: boolean;
}

interface NotificationsPayload {
  notifications?: NotificationRow[];
  rows?: NotificationRow[];
}

/**
 * Lightweight unread-count fetcher for the bell-icon badge.
 * Backend doesn't expose a /count endpoint yet — we just pull the most recent
 * 50 and count `read=false` rows. Cheap enough; cached 60s.
 */
export function useUnreadNotifications(enabled = true) {
  const query = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () =>
      api<NotificationsPayload>('/api/notifications?limit=50&filter[read]=false'),
    enabled,
    staleTime: 60_000,
  });
  const list = query.data?.rows ?? query.data?.notifications ?? [];
  const count = list.filter((n) => !n.read).length;
  return { count, hasUnread: count > 0, refetch: query.refetch };
}
