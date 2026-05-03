export const CAPABILITY_AREAS = [
  'orders',
  'inventory',
  'fleet',
  'quotes',
  'designs',
  'tasks',
  'schedule',
  'attendance',
  'purchase_orders',
  'staff',
  'machinery',
  'admin',
] as const;

export type CapabilityArea = (typeof CAPABILITY_AREAS)[number];

export interface CapabilityDef {
  key: string;
  area: CapabilityArea;
  labelKey: string;
  descriptionKey: string;
}

export const CAPABILITIES = [
  { key: 'orders.read', area: 'orders', labelKey: 'cap.orders.read', descriptionKey: 'cap.orders.read.desc' },
  { key: 'orders.create', area: 'orders', labelKey: 'cap.orders.create', descriptionKey: 'cap.orders.create.desc' },
  { key: 'orders.advance_stage', area: 'orders', labelKey: 'cap.orders.advance', descriptionKey: 'cap.orders.advance.desc' },
  { key: 'inventory.read', area: 'inventory', labelKey: 'cap.inventory.read', descriptionKey: 'cap.inventory.read.desc' },
  { key: 'inventory.consume', area: 'inventory', labelKey: 'cap.inventory.consume', descriptionKey: 'cap.inventory.consume.desc' },
  { key: 'fleet.read', area: 'fleet', labelKey: 'cap.fleet.read', descriptionKey: 'cap.fleet.read.desc' },
  { key: 'fleet.checkout', area: 'fleet', labelKey: 'cap.fleet.checkout', descriptionKey: 'cap.fleet.checkout.desc' },
  { key: 'quotes.read', area: 'quotes', labelKey: 'cap.quotes.read', descriptionKey: 'cap.quotes.read.desc' },
  { key: 'quotes.create', area: 'quotes', labelKey: 'cap.quotes.create', descriptionKey: 'cap.quotes.create.desc' },
  { key: 'bom.manage', area: 'designs', labelKey: 'cap.bom.manage', descriptionKey: 'cap.bom.manage.desc' },
  { key: 'tasks.read', area: 'tasks', labelKey: 'cap.tasks.read', descriptionKey: 'cap.tasks.read.desc' },
  { key: 'tasks.update', area: 'tasks', labelKey: 'cap.tasks.update', descriptionKey: 'cap.tasks.update.desc' },
  { key: 'schedule.read', area: 'schedule', labelKey: 'cap.schedule.read', descriptionKey: 'cap.schedule.read.desc' },
  { key: 'schedule.update', area: 'schedule', labelKey: 'cap.schedule.update', descriptionKey: 'cap.schedule.update.desc' },
  { key: 'attendance.read', area: 'attendance', labelKey: 'cap.attendance.read', descriptionKey: 'cap.attendance.read.desc' },
  { key: 'purchase_orders.read', area: 'purchase_orders', labelKey: 'cap.po.read', descriptionKey: 'cap.po.read.desc' },
  { key: 'purchase_orders.approve', area: 'purchase_orders', labelKey: 'cap.po.approve', descriptionKey: 'cap.po.approve.desc' },
  { key: 'staff.read', area: 'staff', labelKey: 'cap.staff.read', descriptionKey: 'cap.staff.read.desc' },
  { key: 'machinery.read', area: 'machinery', labelKey: 'cap.machinery.read', descriptionKey: 'cap.machinery.read.desc' },
  { key: 'users.manage', area: 'admin', labelKey: 'cap.users.manage', descriptionKey: 'cap.users.manage.desc' },
  { key: 'roles.manage', area: 'admin', labelKey: 'cap.roles.manage', descriptionKey: 'cap.roles.manage.desc' },
  { key: 'stages.manage', area: 'admin', labelKey: 'cap.stages.manage', descriptionKey: 'cap.stages.manage.desc' },
  { key: 'settings.manage', area: 'admin', labelKey: 'cap.settings.manage', descriptionKey: 'cap.settings.manage.desc' },
] as const satisfies readonly CapabilityDef[];

export type CapabilityKey = (typeof CAPABILITIES)[number]['key'];

export const CAPABILITY_KEY_SET: ReadonlySet<string> = new Set(CAPABILITIES.map((c) => c.key));

export const ADMIN_WILDCARD = '*';

export function isValidCapability(key: string): boolean {
  return key === ADMIN_WILDCARD || CAPABILITY_KEY_SET.has(key);
}

export function userHasCapability(userCaps: string[] | undefined, required: string): boolean {
  if (!userCaps) return false;
  if (userCaps.includes(ADMIN_WILDCARD)) return true;
  return userCaps.includes(required);
}
