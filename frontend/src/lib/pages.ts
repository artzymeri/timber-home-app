import type { TranslationKeys } from './i18n/en';

export const PAGE_AREAS = ['admin', 'office', 'factory', 'field'] as const;
export type PageArea = (typeof PAGE_AREAS)[number];

export interface PageDef {
  /** Stable key stored in role.allowed_pages. Format: `<area>.<slug>` */
  key: string;
  /** Route path the page lives at — also used as default_route when starred */
  path: string;
  area: PageArea;
  /** i18n key for the display label. */
  labelKey: TranslationKeys;
  /** Capabilities this page implies (for backend gating). Optional — pages are
   *  primarily about sidebar visibility; API gating still uses checkCapability(). */
  capabilities?: string[];
}

/**
 * Single source of truth for every page that can show in the sidebar.
 *
 * **Adding a new page** (see docs/pages-registry.md):
 *   1. Append a new `PageDef` to this array.
 *   2. Reference its `key` from the matching layout's nav-item entry (`pageKey`).
 *   3. Existing roles will not auto-receive the new page — admins must enable it
 *      from the role wizard. Newly created roles likewise default to OFF.
 */
export const PAGES: readonly PageDef[] = [
  // Admin
  { key: 'admin.dashboard', path: '/admin/dashboard', area: 'admin', labelKey: 'dashboard' },
  { key: 'admin.orders', path: '/admin/orders', area: 'admin', labelKey: 'orders', capabilities: ['orders.read'] },
  { key: 'admin.inventory', path: '/admin/inventory', area: 'admin', labelKey: 'inventory', capabilities: ['inventory.read'] },
  { key: 'admin.purchase_orders', path: '/admin/purchase-orders', area: 'admin', labelKey: 'purchase_orders', capabilities: ['purchase_orders.read'] },
  { key: 'admin.fleet', path: '/admin/fleet', area: 'admin', labelKey: 'fleet', capabilities: ['fleet.read'] },
  { key: 'admin.machinery', path: '/admin/machinery', area: 'admin', labelKey: 'machinery', capabilities: ['machinery.read'] },
  { key: 'admin.users', path: '/admin/users', area: 'admin', labelKey: 'users_title', capabilities: ['users.manage'] },
  { key: 'admin.roles', path: '/admin/roles', area: 'admin', labelKey: 'roles_title', capabilities: ['roles.manage'] },
  { key: 'admin.stages', path: '/admin/stages', area: 'admin', labelKey: 'stages_title', capabilities: ['stages.manage'] },
  { key: 'admin.attendance', path: '/admin/attendance', area: 'admin', labelKey: 'attendance', capabilities: ['attendance.read'] },
  { key: 'admin.notifications', path: '/admin/notifications', area: 'admin', labelKey: 'notifications' },
  { key: 'admin.settings', path: '/admin/settings', area: 'admin', labelKey: 'settings' },

  // Office
  { key: 'office.dashboard', path: '/office/dashboard', area: 'office', labelKey: 'dashboard' },
  { key: 'office.orders', path: '/office/orders', area: 'office', labelKey: 'orders', capabilities: ['orders.read'] },
  { key: 'office.settings', path: '/office/settings', area: 'office', labelKey: 'settings' },

  // Factory
  { key: 'factory.tasks', path: '/factory/tasks', area: 'factory', labelKey: 'my_tasks', capabilities: ['tasks.read'] },
  { key: 'factory.qa_report', path: '/factory/qa-report', area: 'factory', labelKey: 'qa_report', capabilities: ['tasks.update'] },
  { key: 'factory.settings', path: '/factory/settings', area: 'factory', labelKey: 'settings' },

  // Field
  { key: 'field.schedule', path: '/field/schedule', area: 'field', labelKey: 'todays_schedule', capabilities: ['schedule.read'] },
  { key: 'field.fleet_checkout', path: '/field/fleet-checkout', area: 'field', labelKey: 'vehicle_checkout', capabilities: ['fleet.checkout'] },
  { key: 'field.settings', path: '/field/settings', area: 'field', labelKey: 'settings' },
];

export const PAGE_BY_KEY: Record<string, PageDef> = Object.fromEntries(
  PAGES.map((p) => [p.key, p])
);

export const PAGE_BY_PATH: Record<string, PageDef> = Object.fromEntries(
  PAGES.map((p) => [p.path, p])
);

export const PAGE_KEYS = PAGES.map((p) => p.key);

/**
 * Resolve a request pathname to its registered page (longest-prefix match).
 * `/admin/orders/123` → `admin.orders`. Returns `null` if no page matches.
 */
export function resolvePageForPath(pathname: string): PageDef | null {
  let best: PageDef | null = null;
  for (const p of PAGES) {
    if (pathname === p.path || pathname.startsWith(p.path + '/')) {
      if (!best || p.path.length > best.path.length) best = p;
    }
  }
  return best;
}

export const ALL_PAGES_WILDCARD = '*';

export function hasPage(allowed: string[] | undefined, pageKey: string): boolean {
  if (!allowed) return false;
  if (allowed.includes(ALL_PAGES_WILDCARD)) return true;
  return allowed.includes(pageKey);
}

export const AREA_LABEL_KEYS: Record<PageArea, TranslationKeys> = {
  admin: 'pages_area_admin',
  office: 'pages_area_office',
  factory: 'pages_area_factory',
  field: 'pages_area_field',
};

export function groupPagesByArea(): Record<PageArea, PageDef[]> {
  const out = {} as Record<PageArea, PageDef[]>;
  for (const a of PAGE_AREAS) out[a] = [];
  for (const p of PAGES) out[p.area].push(p);
  return out;
}
