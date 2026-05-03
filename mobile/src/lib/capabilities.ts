import type { TranslationKeys } from './i18n/en';

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
  'admin',
] as const;

export type CapabilityArea = (typeof CAPABILITY_AREAS)[number];

export interface CapabilityDef {
  key: string;
  area: CapabilityArea;
  labelKey: TranslationKeys;
  descriptionKey: TranslationKeys;
}

export const CAPABILITIES: readonly CapabilityDef[] = [
  { key: 'orders.read', area: 'orders', labelKey: 'cap_orders_read', descriptionKey: 'cap_orders_read_desc' },
  { key: 'orders.create', area: 'orders', labelKey: 'cap_orders_create', descriptionKey: 'cap_orders_create_desc' },
  { key: 'orders.advance_stage', area: 'orders', labelKey: 'cap_orders_advance', descriptionKey: 'cap_orders_advance_desc' },
  { key: 'inventory.read', area: 'inventory', labelKey: 'cap_inventory_read', descriptionKey: 'cap_inventory_read_desc' },
  { key: 'inventory.consume', area: 'inventory', labelKey: 'cap_inventory_consume', descriptionKey: 'cap_inventory_consume_desc' },
  { key: 'fleet.read', area: 'fleet', labelKey: 'cap_fleet_read', descriptionKey: 'cap_fleet_read_desc' },
  { key: 'fleet.checkout', area: 'fleet', labelKey: 'cap_fleet_checkout', descriptionKey: 'cap_fleet_checkout_desc' },
  { key: 'quotes.read', area: 'quotes', labelKey: 'cap_quotes_read', descriptionKey: 'cap_quotes_read_desc' },
  { key: 'quotes.create', area: 'quotes', labelKey: 'cap_quotes_create', descriptionKey: 'cap_quotes_create_desc' },
  { key: 'bom.manage', area: 'designs', labelKey: 'cap_bom_manage', descriptionKey: 'cap_bom_manage_desc' },
  { key: 'tasks.read', area: 'tasks', labelKey: 'cap_tasks_read', descriptionKey: 'cap_tasks_read_desc' },
  { key: 'tasks.update', area: 'tasks', labelKey: 'cap_tasks_update', descriptionKey: 'cap_tasks_update_desc' },
  { key: 'schedule.read', area: 'schedule', labelKey: 'cap_schedule_read', descriptionKey: 'cap_schedule_read_desc' },
  { key: 'schedule.update', area: 'schedule', labelKey: 'cap_schedule_update', descriptionKey: 'cap_schedule_update_desc' },
  { key: 'attendance.read', area: 'attendance', labelKey: 'cap_attendance_read', descriptionKey: 'cap_attendance_read_desc' },
  { key: 'purchase_orders.read', area: 'purchase_orders', labelKey: 'cap_po_read', descriptionKey: 'cap_po_read_desc' },
  { key: 'purchase_orders.approve', area: 'purchase_orders', labelKey: 'cap_po_approve', descriptionKey: 'cap_po_approve_desc' },
  { key: 'staff.read', area: 'staff', labelKey: 'cap_staff_read', descriptionKey: 'cap_staff_read_desc' },
  { key: 'users.manage', area: 'admin', labelKey: 'cap_users_manage', descriptionKey: 'cap_users_manage_desc' },
  { key: 'roles.manage', area: 'admin', labelKey: 'cap_roles_manage', descriptionKey: 'cap_roles_manage_desc' },
  { key: 'stages.manage', area: 'admin', labelKey: 'cap_stages_manage', descriptionKey: 'cap_stages_manage_desc' },
  { key: 'settings.manage', area: 'admin', labelKey: 'cap_settings_manage', descriptionKey: 'cap_settings_manage_desc' },
];

export const AREA_LABEL_KEYS: Record<CapabilityArea, TranslationKeys> = {
  orders: 'cap_area_orders',
  inventory: 'cap_area_inventory',
  fleet: 'cap_area_fleet',
  quotes: 'cap_area_quotes',
  designs: 'cap_area_designs',
  tasks: 'cap_area_tasks',
  schedule: 'cap_area_schedule',
  attendance: 'cap_area_attendance',
  purchase_orders: 'cap_area_purchase_orders',
  staff: 'cap_area_staff',
  admin: 'cap_area_admin',
};

export const ADMIN_WILDCARD = '*';

export function hasCapability(userCaps: string[] | undefined, required: string): boolean {
  if (!userCaps) return false;
  if (userCaps.includes(ADMIN_WILDCARD)) return true;
  return userCaps.includes(required);
}

export function groupCapabilitiesByArea(): Record<CapabilityArea, CapabilityDef[]> {
  const out = {} as Record<CapabilityArea, CapabilityDef[]>;
  for (const area of CAPABILITY_AREAS) out[area] = [];
  for (const cap of CAPABILITIES) out[cap.area].push(cap);
  return out;
}
