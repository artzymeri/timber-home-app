/**
 * Showcase-scale seeder. Generates ~80 orders across 6 months, 24 extra users,
 * 40 inventory items, fleet, attendance, notifications, BOM, measurements,
 * quotes, and purchase orders — enough that every list paginates and every
 * chart has a real shape.
 *
 * Idempotency: not idempotent on its own — running it twice doubles the data.
 * Pair with `npm run db:reset` for a clean re-run.
 *
 * Usage: `npm run seed:massive`
 */
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';
import sequelize from './config/database';

faker.seed(42); // deterministic data so demos look the same each cycle

// ─── small helpers ──────────────────────────────────────────────────────────

const pickWeighted = <T>(items: T[], weights: number[]): T => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
};

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number, decimals = 2) =>
  Number((Math.random() * (max - min) + min).toFixed(decimals));

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const randomDateInLast = (months: number): Date => {
  const days = months * 30;
  // Weight toward recent: x^0.6 distribution.
  const offset = Math.floor(Math.pow(Math.random(), 0.6) * days);
  return daysAgo(offset);
};

// Office coords from attendance.ts so the geofence rows look realistic.
const OFFICE_LAT = 41.3275;
const OFFICE_LNG = 19.8187;

// ─── data generators ────────────────────────────────────────────────────────

interface Role {
  id: number;
  role_name: string;
}
interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role_name: string;
}
interface Stage {
  id: number;
  code: string;
  is_terminal: boolean;
}

async function loadRoles(): Promise<Map<string, Role>> {
  const [rows]: any = await sequelize.query(`SELECT id, role_name FROM roles`);
  return new Map(rows.map((r: Role) => [r.role_name, r]));
}

async function loadStages(): Promise<Stage[]> {
  const [rows]: any = await sequelize.query(`SELECT id, code, is_terminal FROM stages`);
  return rows.map((r: any) => ({ ...r, is_terminal: !!r.is_terminal }));
}

async function loadUsers(): Promise<User[]> {
  const [rows]: any = await sequelize.query(
    `SELECT u.id, u.name, u.email, u.role_id, r.role_name
       FROM users u JOIN roles r ON u.role_id = r.id`
  );
  return rows;
}

// ─── seed sections ──────────────────────────────────────────────────────────

async function seedUsers(roles: Map<string, Role>): Promise<void> {
  console.log('▶ Users');
  const distribution: Record<string, number> = {
    Sales: 6,
    Designer: 6,
    Cutter: 4,
    Painter: 4,
    Installer: 4,
  };
  const password_hash = await bcrypt.hash('password123', 10);

  for (const [roleName, count] of Object.entries(distribution)) {
    const role = roles.get(roleName);
    if (!role) {
      console.warn(`  · skipped ${roleName} (role not found)`);
      continue;
    }
    for (let i = 0; i < count; i++) {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      const email = `${first}.${last}.${faker.string.alphanumeric(4)}@woodflow.com`.toLowerCase();
      // INSERT IGNORE so re-running without db:reset doesn't crash on the
      // deterministic emails. The seed is meant to pair with reset, but be kind.
      await sequelize.query(
        `INSERT IGNORE INTO users (name, email, password_hash, role_id, must_change_password, created_at, updated_at)
         VALUES (?, ?, ?, ?, false, NOW(), NOW())`,
        { replacements: [`${first} ${last}`, email, password_hash, role.id] }
      );
    }
    console.log(`  ✓ ${roleName.padEnd(12)} +${count}`);
  }
}

async function seedInventory(): Promise<void> {
  console.log('▶ Inventory');
  const items: { name: string; category: string; unit: string; cost: number }[] = [
    { name: 'Oak plank 18mm 2400×1200', category: 'Timber', unit: 'sheet', cost: 92 },
    { name: 'MDF 18mm 2440×1220', category: 'Timber', unit: 'sheet', cost: 38 },
    { name: 'Birch plywood 12mm', category: 'Timber', unit: 'sheet', cost: 64 },
    { name: 'Walnut veneer roll', category: 'Timber', unit: 'roll', cost: 145 },
    { name: 'Beech plank 22mm', category: 'Timber', unit: 'sheet', cost: 78 },
    { name: 'Pine 2×4 stud', category: 'Timber', unit: 'pcs', cost: 6.5 },
    { name: 'Hinge concealed soft-close', category: 'Hardware', unit: 'pcs', cost: 4.2 },
    { name: 'Drawer slide 500mm', category: 'Hardware', unit: 'pair', cost: 11 },
    { name: 'Cabinet handle brushed brass', category: 'Hardware', unit: 'pcs', cost: 7.5 },
    { name: 'Push-to-open latch', category: 'Hardware', unit: 'pcs', cost: 2.8 },
    { name: 'Shelf pin 5mm', category: 'Hardware', unit: 'pcs', cost: 0.15 },
    { name: 'Lazy-Susan corner unit', category: 'Hardware', unit: 'pcs', cost: 56 },
    { name: 'Wood screw 4×40mm', category: 'Fasteners', unit: 'box', cost: 8 },
    { name: 'Wood screw 6×80mm', category: 'Fasteners', unit: 'box', cost: 12 },
    { name: 'Confirmat screw 7×50', category: 'Fasteners', unit: 'box', cost: 10 },
    { name: 'Pocket-hole screw kit', category: 'Fasteners', unit: 'box', cost: 18 },
    { name: 'Dowel 8×40mm', category: 'Fasteners', unit: 'pack', cost: 5 },
    { name: 'Wood glue PVA 1L', category: 'Finish', unit: 'bottle', cost: 9 },
    { name: 'Polyurethane lacquer matte', category: 'Finish', unit: 'L', cost: 22 },
    { name: 'Polyurethane lacquer satin', category: 'Finish', unit: 'L', cost: 22 },
    { name: 'Stain — walnut', category: 'Finish', unit: 'L', cost: 18 },
    { name: 'Stain — natural oak', category: 'Finish', unit: 'L', cost: 18 },
    { name: 'Wax finish neutral', category: 'Finish', unit: 'jar', cost: 14 },
    { name: 'Sandpaper 120 grit pack', category: 'Finish', unit: 'pack', cost: 6 },
    { name: 'Sandpaper 240 grit pack', category: 'Finish', unit: 'pack', cost: 6 },
    { name: 'Tempered glass 6mm 1m²', category: 'Glass', unit: 'm²', cost: 48 },
    { name: 'Frosted glass 4mm 1m²', category: 'Glass', unit: 'm²', cost: 38 },
    { name: 'Mirror panel 4mm', category: 'Glass', unit: 'm²', cost: 32 },
    { name: 'Edge banding oak 22mm', category: 'Edging', unit: 'm', cost: 1.8 },
    { name: 'Edge banding walnut 22mm', category: 'Edging', unit: 'm', cost: 2.2 },
    { name: 'Edge banding white 22mm', category: 'Edging', unit: 'm', cost: 1.4 },
    { name: 'Linen upholstery natural', category: 'Fabric', unit: 'm', cost: 28 },
    { name: 'Velvet upholstery navy', category: 'Fabric', unit: 'm', cost: 34 },
    { name: 'Foam high-density 50mm', category: 'Fabric', unit: 'm²', cost: 22 },
    { name: 'LED strip warm 5m', category: 'Lighting', unit: 'roll', cost: 26 },
    { name: 'LED driver 24V 60W', category: 'Lighting', unit: 'pcs', cost: 18 },
    { name: 'PIR motion sensor', category: 'Lighting', unit: 'pcs', cost: 12 },
    { name: 'Iron leg 200mm matte black', category: 'Hardware', unit: 'pcs', cost: 9 },
    { name: 'Caster wheel 50mm braked', category: 'Hardware', unit: 'pcs', cost: 4 },
    { name: 'Magnetic catch heavy duty', category: 'Hardware', unit: 'pcs', cost: 3 },
  ];

  // Mark ~6 items as low-stock so the dashboard warning state shows.
  const lowStockIdx = new Set(faker.helpers.arrayElements([...items.keys()], 6));

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const reorder = randInt(8, 30);
    const qty = lowStockIdx.has(i) ? randInt(0, reorder - 1) : randInt(reorder + 5, reorder * 6);
    await sequelize.query(
      `INSERT INTO inventory (name, category, unit, quantity, reorder_level, cost_per_unit, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      { replacements: [it.name, it.category, it.unit, qty, reorder, it.cost] }
    );
  }
  console.log(`  ✓ ${items.length} items (${lowStockIdx.size} flagged low-stock)`);
}

async function seedFleet(): Promise<void> {
  console.log('▶ Fleet');
  const vehicles = [
    { name: 'Ford Transit Custom', plate: 'AA-101-WF', status: 'available' },
    { name: 'Mercedes Sprinter', plate: 'AA-102-WF', status: 'in_use' },
    { name: 'Renault Trafic', plate: 'AA-103-WF', status: 'available' },
    { name: 'Toyota Hilux', plate: 'AA-104-WF', status: 'maintenance' },
    { name: 'Ford Ranger', plate: 'AA-105-WF', status: 'available' },
    { name: 'Iveco Daily 35S', plate: 'AA-106-WF', status: 'in_use' },
  ];
  // The fleet table has ENUM('available','checked_out','maintenance') — map.
  const statusMap: Record<string, string> = {
    available: 'available',
    in_use: 'checked_out',
    maintenance: 'maintenance',
  };
  for (const v of vehicles) {
    await sequelize.query(
      `INSERT IGNORE INTO fleet (vehicle_name, plate_number, status, next_service_date, registration_expiry, insurance_expiry, last_latitude, last_longitude, last_gps_update, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      {
        replacements: [
          v.name,
          v.plate,
          statusMap[v.status] || 'available',
          faker.date.future({ years: 0.5 }).toISOString().slice(0, 10),
          faker.date.future({ years: 1 }).toISOString().slice(0, 10),
          faker.date.future({ years: 1 }).toISOString().slice(0, 10),
          OFFICE_LAT + randFloat(-0.01, 0.01, 6),
          OFFICE_LNG + randFloat(-0.01, 0.01, 6),
        ],
      }
    );
  }
  console.log(`  ✓ ${vehicles.length} vehicles`);

  // Service history per vehicle
  const [fleetRows]: any = await sequelize.query(`SELECT id FROM fleet`);
  for (const f of fleetRows) {
    const services = randInt(1, 2);
    for (let i = 0; i < services; i++) {
      const date = faker.date.past({ years: 1 }).toISOString().slice(0, 10);
      await sequelize.query(
        `INSERT INTO vehicle_services (vehicle_id, service_type, description, cost, service_date, next_service_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [
            f.id,
            faker.helpers.arrayElement(['Oil change', 'Tire rotation', 'Brake pads', 'Annual inspection', 'Battery']),
            faker.lorem.sentence(),
            randFloat(80, 600),
            date,
            faker.date.future({ years: 0.5 }).toISOString().slice(0, 10),
          ],
        }
      );
    }
  }
}

async function seedOrders(stages: Stage[], users: User[]): Promise<number[]> {
  console.log('▶ Orders');
  // Stage code → legacy enum value for the orders.status column.
  const legacyMap: Record<string, string> = {
    estimate: 'ESTIMATE',
    measurement: 'MEASUREMENT',
    design_approval: 'DESIGN_APPROVAL',
    manufacturing: 'CUTTING',
    cutting: 'CUTTING',
    cnc: 'CNC',
    finishing: 'FINISHING',
    packing: 'PACKING',
    installation: 'INSTALLATION',
    completed: 'COMPLETED',
  };

  // Weighted target stages: 25% completed, 15% installation, 30% manufacturing
  // children, 30% earlier stages.
  const stageBuckets = {
    completed: stages.filter((s) => s.code === 'completed'),
    installation: stages.filter((s) => s.code === 'installation'),
    manufacturing: stages.filter((s) =>
      ['cutting', 'cnc', 'finishing', 'packing'].includes(s.code)
    ),
    early: stages.filter((s) => ['estimate', 'measurement', 'design_approval'].includes(s.code)),
  };

  const orderIds: number[] = [];
  const TARGET_ORDERS = 80;

  for (let i = 0; i < TARGET_ORDERS; i++) {
    const bucket = pickWeighted(
      ['completed', 'installation', 'manufacturing', 'early'],
      [25, 15, 30, 30]
    );
    const stage = faker.helpers.arrayElement(stageBuckets[bucket as keyof typeof stageBuckets]);

    // Pick an assignee whose role matches the stage's typical owner.
    let assignee: User | undefined;
    switch (stage.code) {
      case 'estimate':
      case 'measurement':
        assignee = faker.helpers.arrayElement(users.filter((u) => u.role_name === 'Sales'));
        break;
      case 'design_approval':
        assignee = faker.helpers.arrayElement(users.filter((u) => u.role_name === 'Designer'));
        break;
      case 'cutting':
      case 'cnc':
        assignee = faker.helpers.arrayElement(users.filter((u) => u.role_name === 'Cutter'));
        break;
      case 'finishing':
      case 'packing':
        assignee = faker.helpers.arrayElement(users.filter((u) => u.role_name === 'Painter'));
        break;
      case 'installation':
        assignee = faker.helpers.arrayElement(users.filter((u) => u.role_name === 'Installer'));
        break;
      default:
        assignee = faker.helpers.arrayElement(users);
    }

    const created = randomDateInLast(6);
    const total = randFloat(1500, 18000);

    const [result]: any = await sequelize.query(
      `INSERT INTO orders (client_name, client_email, client_phone, address, status, stage_id, assigned_to, total_amount, notes, qr_token, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          faker.person.fullName(),
          faker.internet.email().toLowerCase(),
          faker.phone.number({ style: 'international' }),
          `${faker.location.streetAddress()}, ${faker.location.city()}`,
          legacyMap[stage.code] || 'ESTIMATE',
          stage.id,
          assignee?.id ?? null,
          total,
          faker.lorem.sentences(2),
          randomUUID(),
          created,
          created,
        ],
      }
    );
    orderIds.push((result as any) as number);
  }

  // The query above returns insertId differently in mysql2; re-fetch all the
  // ids we just created to be safe.
  const [allOrders]: any = await sequelize.query(
    `SELECT id FROM orders ORDER BY id DESC LIMIT ?`,
    { replacements: [TARGET_ORDERS] }
  );
  const ids = allOrders.map((r: any) => r.id);
  console.log(`  ✓ ${ids.length} orders across 6 months`);
  return ids;
}

async function seedOrderChildren(orderIds: number[], users: User[]): Promise<void> {
  console.log('▶ BOM / measurements / quotes');
  const [inventory]: any = await sequelize.query(`SELECT id, name, unit, cost_per_unit FROM inventory`);
  const designers = users.filter((u) => u.role_name === 'Designer');
  const sales = users.filter((u) => u.role_name === 'Sales');

  let bomCount = 0;
  let measCount = 0;
  let quoteCount = 0;

  for (const orderId of orderIds) {
    // BOM: 4–8 items
    const bomSize = randInt(4, 8);
    const items: any[] = faker.helpers.arrayElements(inventory, bomSize);
    for (const m of items) {
      const qty = randFloat(0.5, 12, 1);
      const unit_cost = Number(m.cost_per_unit) || randFloat(2, 80);
      const total_cost = Number((qty * unit_cost).toFixed(2));
      await sequelize.query(
        `INSERT INTO bom_items (order_id, inventory_id, material_name, quantity, unit, unit_cost, total_cost, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        { replacements: [orderId, m.id, m.name, qty, m.unit, unit_cost, total_cost] }
      );
      bomCount++;
    }

    // Measurements: 1–4 rooms
    const rooms = randInt(1, 4);
    const recorder = faker.helpers.arrayElement(designers.length > 0 ? designers : users);
    for (let r = 0; r < rooms; r++) {
      const dims = {
        width: randInt(60, 360),
        height: randInt(60, 280),
        depth: randInt(30, 100),
      };
      await sequelize.query(
        `INSERT INTO measurements (order_id, recorded_by, room_name, dimensions, notes, photos, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [
            orderId,
            recorder.id,
            faker.helpers.arrayElement([
              'Kitchen',
              'Master bedroom',
              'Living room',
              'Office',
              'Hallway',
              'Bathroom',
              'Walk-in closet',
              'Dining',
            ]),
            JSON.stringify(dims),
            faker.lorem.sentence(),
            JSON.stringify([]),
          ],
        }
      );
      measCount++;
    }

    // 1 quote per order
    const status = pickWeighted(['draft', 'sent', 'approved', 'rejected'], [15, 25, 55, 5]);
    const materials_cost = randFloat(800, 9000);
    const labor_hours = randFloat(8, 80, 1);
    const labor_rate = 35;
    const labor_cost = Number((labor_hours * labor_rate).toFixed(2));
    const markup = 20;
    const subtotal = Number((materials_cost + labor_cost).toFixed(2));
    const tax = 18;
    const total = Number((subtotal * (1 + markup / 100) * (1 + tax / 100)).toFixed(2));
    await sequelize.query(
      `INSERT INTO quotes (order_id, created_by, materials_cost, labor_hours, labor_rate, labor_cost, markup_percent, subtotal, tax_percent, total, status, client_approved_at, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: [
          orderId,
          faker.helpers.arrayElement(sales.length > 0 ? sales : users).id,
          materials_cost,
          labor_hours,
          labor_rate,
          labor_cost,
          markup,
          subtotal,
          tax,
          total,
          status,
          status === 'approved' ? faker.date.recent({ days: 30 }) : null,
          faker.lorem.sentence(),
        ],
      }
    );
    quoteCount++;
  }

  console.log(`  ✓ ${bomCount} BOM items, ${measCount} measurements, ${quoteCount} quotes`);
}

async function seedAttendance(users: User[]): Promise<void> {
  console.log('▶ Attendance');
  // 30 working days × ~25 active users (skip admins for realism)
  const active = users.filter((u) => u.role_name !== 'Admin');
  let inserted = 0;

  for (let day = 30; day >= 1; day--) {
    const date = daysAgo(day);
    // Skip weekends-ish for a touch more realism (every 7th and 8th day).
    if (day % 7 === 0 || day % 7 === 6) continue;

    for (const user of active) {
      // 90% attendance rate
      if (Math.random() > 0.9) continue;

      const checkInTime = new Date(date);
      checkInTime.setHours(8, randInt(0, 30), 0);
      const withinRadius = Math.random() > 0.1; // 90% within
      const lat = withinRadius ? OFFICE_LAT + randFloat(-0.001, 0.001, 6) : OFFICE_LAT + randFloat(-0.05, 0.05, 6);
      const lng = withinRadius ? OFFICE_LNG + randFloat(-0.001, 0.001, 6) : OFFICE_LNG + randFloat(-0.05, 0.05, 6);

      await sequelize.query(
        `INSERT INTO attendance (user_id, type, latitude, longitude, is_within_radius, created_at, updated_at)
         VALUES (?, 'check_in', ?, ?, ?, ?, ?)`,
        { replacements: [user.id, lat, lng, withinRadius, checkInTime, checkInTime] }
      );
      inserted++;

      // 70% also have a check-out
      if (Math.random() < 0.7) {
        const out = new Date(checkInTime);
        out.setHours(out.getHours() + 8, randInt(0, 30), 0);
        await sequelize.query(
          `INSERT INTO attendance (user_id, type, latitude, longitude, is_within_radius, created_at, updated_at)
           VALUES (?, 'check_out', ?, ?, ?, ?, ?)`,
          { replacements: [user.id, lat, lng, withinRadius, out, out] }
        );
        inserted++;
      }
    }
  }
  console.log(`  ✓ ${inserted} attendance rows`);
}

async function seedNotifications(users: User[]): Promise<void> {
  console.log('▶ Notifications');
  const types = ['info', 'warning', 'success', 'error'];
  let count = 0;
  for (const u of users) {
    const n = randInt(3, 6);
    for (let i = 0; i < n; i++) {
      const type = faker.helpers.arrayElement(types);
      await sequelize.query(
        `INSERT INTO notifications (user_id, title, message, type, \`read\`, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        {
          replacements: [
            u.id,
            faker.helpers.arrayElement([
              'Order stage advanced',
              'New quote approved',
              'Low stock warning',
              'QA report submitted',
              'Vehicle service due',
              'Schedule updated',
              'Payment received',
            ]),
            faker.lorem.sentence(),
            type,
            Math.random() < 0.6,
            faker.date.recent({ days: 14 }),
          ],
        }
      );
      count++;
    }
  }
  console.log(`  ✓ ${count} notifications`);
}

async function seedPurchaseOrders(users: User[]): Promise<void> {
  console.log('▶ Purchase orders');
  const [inventory]: any = await sequelize.query(
    `SELECT id, name, cost_per_unit FROM inventory WHERE quantity <= reorder_level LIMIT 12`
  );
  const admin = users.find((u) => u.role_name === 'Admin');
  const statuses = ['suggested', 'pending_approval', 'approved', 'ordered', 'received'];

  let count = 0;
  for (const item of inventory) {
    const status = faker.helpers.arrayElement(statuses);
    const qty = randInt(20, 100);
    const total = (Number(item.cost_per_unit) || 10) * qty;
    await sequelize.query(
      `INSERT INTO purchase_orders (inventory_id, quantity, unit_cost, total_cost, status, approved_by, supplier, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      {
        replacements: [
          item.id,
          qty,
          item.cost_per_unit,
          total,
          status,
          status === 'approved' || status === 'ordered' || status === 'received' ? admin?.id ?? null : null,
          faker.company.name(),
          faker.lorem.sentence(),
          faker.date.recent({ days: 30 }),
        ],
      }
    );
    count++;
  }
  console.log(`  ✓ ${count} purchase orders`);
}

async function seedMachinery(): Promise<void> {
  console.log('▶ Machinery');
  // Hand-picked so the dashboard alert + sidebar badge always show 2 machines
  // in error after a fresh reset+seed. Names read like real shop equipment.
  const machines: Array<{
    name: string;
    type: string;
    serial: string;
    location: string;
    status: 'operational' | 'idle' | 'maintenance' | 'error';
    error_message: string | null;
  }> = [
    { name: 'CNC Router #1', type: 'CNC Router', serial: 'CNC-A-2104', location: 'Bay 1', status: 'operational', error_message: null },
    { name: 'CNC Router #2', type: 'CNC Router', serial: 'CNC-B-2105', location: 'Bay 1', status: 'error', error_message: 'Spindle temperature out of range — service required.' },
    { name: 'Panel Saw Alpha', type: 'Panel Saw', serial: 'PSAW-α-008', location: 'Bay 2', status: 'operational', error_message: null },
    { name: 'Panel Saw Beta', type: 'Panel Saw', serial: 'PSAW-β-009', location: 'Bay 2', status: 'maintenance', error_message: null },
    { name: 'Edgebander 3000', type: 'Edgebander', serial: 'EDGE-3000-12', location: 'Bay 3', status: 'operational', error_message: null },
    { name: 'Wide-Belt Sander', type: 'Sander', serial: 'WBS-44-1A', location: 'Bay 3', status: 'error', error_message: 'Belt tension sensor fault, code E-23. Replace tension arm.' },
    { name: 'Drill Press XL', type: 'Drill Press', serial: 'DPX-77-04', location: 'Bay 4', status: 'idle', error_message: null },
    { name: 'Lacquer Booth', type: 'Finishing Booth', serial: 'LB-AIR-01', location: 'Finishing', status: 'operational', error_message: null },
  ];

  for (const m of machines) {
    const lastService = m.status === 'maintenance'
      ? null
      : faker.date.recent({ days: 90 });
    await sequelize.query(
      `INSERT IGNORE INTO machinery (name, type, serial_number, location, status, error_message, last_service_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: [m.name, m.type, m.serial, m.location, m.status, m.error_message, lastService],
      }
    );
  }
  const errs = machines.filter((m) => m.status === 'error').length;
  console.log(`  ✓ ${machines.length} machines (${errs} in error)`);
}

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  await sequelize.authenticate();
  console.log('🌱 Seeding showcase data…\n');

  const roles = await loadRoles();
  if (roles.size === 0) {
    console.error('No roles found — run `npm run seed` first to baseline roles + 6 demo users.');
    process.exit(1);
  }

  // Guard against double-seeding. Most tables have no unique constraints, so
  // re-running silently doubles the data; a few do, and crash. Either way:
  // refuse to proceed and point the user at db:reset.
  const [orderCount]: any = await sequelize.query(`SELECT COUNT(*) AS n FROM orders`);
  if (Number(orderCount[0]?.n || 0) > 0) {
    console.error(
      `❌ Database already contains ${orderCount[0].n} orders. ` +
        `Run \`npm run db:reset\` first to clear, then re-run \`npm run seed:massive\`.`
    );
    process.exit(1);
  }

  await seedUsers(roles);
  const users = await loadUsers();
  if (users.length < 12) {
    throw new Error('Expected ≥12 users after seeding extras; aborting.');
  }

  await seedInventory();
  await seedFleet();
  const stages = await loadStages();
  const orderIds = await seedOrders(stages, users);
  await seedOrderChildren(orderIds, users);
  await seedAttendance(users);
  await seedNotifications(users);
  await seedPurchaseOrders(users);
  await seedMachinery();

  console.log('\n✅ Showcase seed complete.');
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
