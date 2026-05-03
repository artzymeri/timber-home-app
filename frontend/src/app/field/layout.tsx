'use client';

import { AppShell, NavItem } from '@/components/app-shell';

const navItems: NavItem[] = [
  { label: 'todays_schedule', href: '/field/schedule', pageKey: 'field.schedule', section: 'workspace' },
  { label: 'vehicle_checkout', href: '/field/fleet-checkout', pageKey: 'field.fleet_checkout', section: 'workspace' },
  { label: 'settings', href: '/field/settings', pageKey: 'field.settings', section: 'account' },
];

export default function FieldLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={navItems}>
      {children}
    </AppShell>
  );
}
