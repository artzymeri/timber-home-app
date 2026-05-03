/**
 * Page registry — mirror of frontend/src/lib/pages.ts (must stay in sync).
 * Server-side, this is used to validate role.allowed_pages payloads on
 * POST/PATCH /api/roles, and as documentation for what page keys exist.
 *
 * See docs/pages-registry.md for the convention around adding new pages.
 */
export interface PageDef {
  key: string;
  path: string;
  area: 'admin' | 'office' | 'factory' | 'field';
  capabilities?: string[];
}

export const PAGES: readonly PageDef[] = [
  // Admin
  { key: 'admin.dashboard', path: '/admin/dashboard', area: 'admin' },
  { key: 'admin.orders', path: '/admin/orders', area: 'admin', capabilities: ['orders.read'] },
  { key: 'admin.inventory', path: '/admin/inventory', area: 'admin', capabilities: ['inventory.read'] },
  { key: 'admin.purchase_orders', path: '/admin/purchase-orders', area: 'admin', capabilities: ['purchase_orders.read'] },
  { key: 'admin.fleet', path: '/admin/fleet', area: 'admin', capabilities: ['fleet.read'] },
  { key: 'admin.machinery', path: '/admin/machinery', area: 'admin', capabilities: ['machinery.read'] },
  { key: 'admin.users', path: '/admin/users', area: 'admin', capabilities: ['users.manage'] },
  { key: 'admin.roles', path: '/admin/roles', area: 'admin', capabilities: ['roles.manage'] },
  { key: 'admin.stages', path: '/admin/stages', area: 'admin', capabilities: ['stages.manage'] },
  { key: 'admin.attendance', path: '/admin/attendance', area: 'admin', capabilities: ['attendance.read'] },
  { key: 'admin.notifications', path: '/admin/notifications', area: 'admin' },
  { key: 'admin.settings', path: '/admin/settings', area: 'admin' },

  // Office
  { key: 'office.dashboard', path: '/office/dashboard', area: 'office' },
  { key: 'office.orders', path: '/office/orders', area: 'office', capabilities: ['orders.read'] },
  { key: 'office.settings', path: '/office/settings', area: 'office' },

  // Factory
  { key: 'factory.tasks', path: '/factory/tasks', area: 'factory', capabilities: ['tasks.read'] },
  { key: 'factory.qa_report', path: '/factory/qa-report', area: 'factory', capabilities: ['tasks.update'] },
  { key: 'factory.settings', path: '/factory/settings', area: 'factory' },

  // Field
  { key: 'field.schedule', path: '/field/schedule', area: 'field', capabilities: ['schedule.read'] },
  { key: 'field.fleet_checkout', path: '/field/fleet-checkout', area: 'field', capabilities: ['fleet.checkout'] },
  { key: 'field.settings', path: '/field/settings', area: 'field' },
];

export const PAGE_KEY_SET: ReadonlySet<string> = new Set(PAGES.map((p) => p.key));
export const PAGE_PATH_SET: ReadonlySet<string> = new Set(PAGES.map((p) => p.path));

export const ALL_PAGES_WILDCARD = '*';

export function isValidPageKey(key: string): boolean {
  return key === ALL_PAGES_WILDCARD || PAGE_KEY_SET.has(key);
}

/**
 * Derive the capability set implied by a list of allowed page keys.
 * '*' grants every capability transitively (used by Admin).
 */
export function pagesToCapabilities(pages: string[]): string[] {
  if (pages.includes(ALL_PAGES_WILDCARD)) return ['*'];
  const caps = new Set<string>();
  for (const key of pages) {
    const p = PAGES.find((pg) => pg.key === key);
    if (!p?.capabilities) continue;
    for (const c of p.capabilities) caps.add(c);
  }
  return [...caps];
}
