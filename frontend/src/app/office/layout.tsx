'use client';

import { AppShell, NavItem } from '@/components/app-shell';
import { useI18n } from '@/lib/i18n';

const navItems: NavItem[] = [
  { label: 'dashboard', href: '/office/dashboard', pageKey: 'office.dashboard', section: 'workspace' },
  { label: 'orders', href: '/office/orders', pageKey: 'office.orders', section: 'workspace' },
  { label: 'settings', href: '/office/settings', pageKey: 'office.settings', section: 'account' },
];

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <AppShell navItems={navItems} panelLabel={t('app_name')}>
      {children}
    </AppShell>
  );
}
