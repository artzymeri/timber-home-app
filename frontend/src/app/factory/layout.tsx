'use client';

import { AppShell, NavItem } from '@/components/app-shell';

const navItems: NavItem[] = [
  { label: 'my_tasks', href: '/factory/tasks', pageKey: 'factory.tasks', section: 'workspace' },
  { label: 'qa_report', href: '/factory/qa-report', pageKey: 'factory.qa_report', section: 'workspace' },
  { label: 'settings', href: '/factory/settings', pageKey: 'factory.settings', section: 'account' },
];

export default function FactoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={navItems}>
      {children}
    </AppShell>
  );
}
