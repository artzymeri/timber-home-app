import bcrypt from 'bcryptjs';
import sequelize from './config/database';
import Role from './models/Role';
import User from './models/User';

const roles: Array<{
  role_name: string;
  permissions: string[];
  allowed_pages: string[];
  icon: string;
  default_route: string;
  is_system: boolean;
  description: string;
}> = [
  {
    role_name: 'Admin',
    permissions: ['*'],
    allowed_pages: ['*'],
    icon: 'ShieldCheck',
    default_route: '/admin/dashboard',
    is_system: true,
    description: 'Full access to every area of the application.',
  },
  {
    role_name: 'Sales',
    permissions: [
      'orders.read',
      'orders.create',
      'quotes.read',
      'quotes.create',
      'bom.manage',
      'staff.read',
    ],
    allowed_pages: ['office.dashboard', 'office.orders', 'office.settings'],
    icon: 'BadgeDollarSign',
    default_route: '/office/dashboard',
    is_system: false,
    description: 'Creates orders and quotes for clients.',
  },
  {
    role_name: 'Designer',
    permissions: ['orders.read', 'bom.manage', 'inventory.read'],
    allowed_pages: ['office.dashboard', 'office.orders', 'office.settings'],
    icon: 'Pencil',
    default_route: '/office/dashboard',
    is_system: false,
    description: 'Designs furniture and prepares the bill of materials.',
  },
  {
    role_name: 'Cutter',
    permissions: ['tasks.read', 'tasks.update', 'inventory.read', 'inventory.consume', 'orders.advance_stage'],
    allowed_pages: ['factory.tasks', 'factory.qa_report', 'factory.settings'],
    icon: 'Scissors',
    default_route: '/factory/tasks',
    is_system: false,
    description: 'Cuts panels and consumes raw materials.',
  },
  {
    role_name: 'Painter',
    permissions: ['tasks.read', 'tasks.update', 'orders.advance_stage'],
    allowed_pages: ['factory.tasks', 'factory.qa_report', 'factory.settings'],
    icon: 'Paintbrush',
    default_route: '/factory/tasks',
    is_system: false,
    description: 'Finishes and paints prepared parts.',
  },
  {
    role_name: 'Installer',
    permissions: ['schedule.read', 'schedule.update', 'fleet.read', 'fleet.checkout', 'orders.advance_stage'],
    allowed_pages: ['field.schedule', 'field.fleet_checkout', 'field.settings'],
    icon: 'Wrench',
    default_route: '/field/schedule',
    is_system: false,
    description: 'Delivers and installs finished pieces on-site.',
  },
];

const users = [
  { name: 'Admin User', email: 'admin@woodflow.com', password: 'password123', role_name: 'Admin' },
  { name: 'Sarah Sales', email: 'sarah@woodflow.com', password: 'password123', role_name: 'Sales' },
  { name: 'Derek Designer', email: 'derek@woodflow.com', password: 'password123', role_name: 'Designer' },
  { name: 'Carl Cutter', email: 'carl@woodflow.com', password: 'password123', role_name: 'Cutter' },
  { name: 'Paula Painter', email: 'paula@woodflow.com', password: 'password123', role_name: 'Painter' },
  { name: 'Ian Installer', email: 'ian@woodflow.com', password: 'password123', role_name: 'Installer' },
];

async function seed() {
  await sequelize.authenticate();
  console.log('Seeding database...');

  for (const r of roles) {
    const [role] = await Role.findOrCreate({ where: { role_name: r.role_name }, defaults: r });
    await role.update({
      permissions: r.permissions,
      allowed_pages: r.allowed_pages,
      icon: r.icon,
      default_route: r.default_route,
      is_system: r.is_system,
      description: r.description,
    });
  }
  console.log('Roles seeded.');

  for (const u of users) {
    const role = await Role.findOne({ where: { role_name: u.role_name } });
    if (!role) continue;
    const password_hash = await bcrypt.hash(u.password, 10);
    await User.findOrCreate({
      where: { email: u.email },
      defaults: { name: u.name, email: u.email, password_hash, role_id: role.id },
    });
  }
  console.log('Users seeded.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
