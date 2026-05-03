'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppShell, NavItem } from '@/components/app-shell';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';

const baseNav: NavItem[] = [
  { label: 'dashboard', href: '/admin/dashboard', pageKey: 'admin.dashboard', section: 'workspace' },
  { label: 'orders', href: '/admin/orders', pageKey: 'admin.orders', section: 'workspace' },
  { label: 'inventory', href: '/admin/inventory', pageKey: 'admin.inventory', section: 'workspace' },
  { label: 'purchase_orders', href: '/admin/purchase-orders', pageKey: 'admin.purchase_orders', section: 'workspace' },
  { label: 'fleet', href: '/admin/fleet', pageKey: 'admin.fleet', section: 'workspace' },
  { label: 'machinery', href: '/admin/machinery', pageKey: 'admin.machinery', section: 'workspace' },
  { label: 'users_title', href: '/admin/users', pageKey: 'admin.users', section: 'workspace' },
  { label: 'roles_title', href: '/admin/roles', pageKey: 'admin.roles', section: 'workspace' },
  { label: 'stages_title', href: '/admin/stages', pageKey: 'admin.stages', section: 'workspace' },
  { label: 'attendance', href: '/admin/attendance', pageKey: 'admin.attendance', section: 'workspace' },
  { label: 'notifications', href: '/admin/notifications', pageKey: 'admin.notifications', section: 'account' },
  { label: 'settings', href: '/admin/settings', pageKey: 'admin.settings', section: 'account' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { hasCapability } = useAuth();
  const canCreateOrder = hasCapability('orders.create');
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api<{ count: number }>('/api/machinery/error-count')
        .then((d) => {
          if (!cancelled) setErrorCount(d.count || 0);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const navItems = useMemo<NavItem[]>(
    () =>
      baseNav.map((item) => {
        if (item.pageKey === 'admin.machinery' && errorCount > 0) {
          return { ...item, badge: errorCount, badgeTone: 'destructive' };
        }
        if (item.pageKey === 'admin.orders' && canCreateOrder) {
          return {
            ...item,
            trailingAction: {
              icon: Plus,
              href: '/admin/orders?create=1',
              ariaLabel: t('create_order'),
            },
          };
        }
        return item;
      }),
    [errorCount, canCreateOrder, t]
  );

  return (
    <AppShell navItems={navItems} panelLabel={t('admin_panel')}>
      {children}
    </AppShell>
  );
}
