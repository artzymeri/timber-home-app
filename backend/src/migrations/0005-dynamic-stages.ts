import { QueryInterface, DataTypes, QueryTypes } from 'sequelize';

interface SeedStage {
  code: string;
  label_key: string | null;
  name: string;
  parent_code: string | null;
  sort_order: number;
  icon: string;
  color: string;
  is_initial: boolean;
  is_terminal: boolean;
}

const SEED: SeedStage[] = [
  { code: 'estimate',        label_key: 'ESTIMATE',        name: 'Estimate',        parent_code: null,            sort_order: 10, icon: 'Receipt',     color: 'stone',   is_initial: true,  is_terminal: false },
  { code: 'measurement',     label_key: 'MEASUREMENT',     name: 'Measurement',     parent_code: null,            sort_order: 20, icon: 'Ruler',       color: 'stone',   is_initial: false, is_terminal: false },
  { code: 'design_approval', label_key: 'DESIGN_APPROVAL', name: 'Design Approval', parent_code: null,            sort_order: 30, icon: 'Pencil',      color: 'violet',  is_initial: false, is_terminal: false },
  { code: 'manufacturing',   label_key: 'MANUFACTURING',   name: 'Manufacturing',   parent_code: null,            sort_order: 40, icon: 'Factory',     color: 'amber',   is_initial: false, is_terminal: false },
  { code: 'cutting',         label_key: 'CUTTING',         name: 'Cutting',         parent_code: 'manufacturing', sort_order: 10, icon: 'Scissors',    color: 'amber',   is_initial: false, is_terminal: false },
  { code: 'cnc',             label_key: 'CNC',             name: 'CNC',             parent_code: 'manufacturing', sort_order: 20, icon: 'Settings',    color: 'amber',   is_initial: false, is_terminal: false },
  { code: 'finishing',       label_key: 'FINISHING',       name: 'Finishing',       parent_code: 'manufacturing', sort_order: 30, icon: 'Paintbrush',  color: 'amber',   is_initial: false, is_terminal: false },
  { code: 'packing',         label_key: 'PACKING',         name: 'Packing',         parent_code: 'manufacturing', sort_order: 40, icon: 'Package',     color: 'amber',   is_initial: false, is_terminal: false },
  { code: 'installation',    label_key: 'INSTALLATION',    name: 'Installation',    parent_code: null,            sort_order: 50, icon: 'Wrench',      color: 'blue',    is_initial: false, is_terminal: false },
  { code: 'completed',       label_key: 'COMPLETED',       name: 'Completed',       parent_code: null,            sort_order: 60, icon: 'CheckSquare', color: 'emerald', is_initial: false, is_terminal: true  },
];

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
  // 1. Create stages table
  await queryInterface.createTable('stages', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    label_key: { type: DataTypes.STRING(80), allowNull: true },
    name: { type: DataTypes.STRING(80), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    parent_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'stages', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    icon: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'Circle' },
    color: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'stone' },
    is_initial: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_terminal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_system: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex('stages', ['parent_id', 'sort_order']);

  const sequelize = queryInterface.sequelize;

  // 2. Seed root stages first, then children (parent_id resolution)
  for (const s of SEED.filter((s) => s.parent_code === null)) {
    await sequelize.query(
      `INSERT INTO stages (code, label_key, name, parent_id, sort_order, icon, color, is_initial, is_terminal, is_system, created_at, updated_at)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      {
        replacements: [
          s.code,
          s.label_key,
          s.name,
          s.sort_order,
          s.icon,
          s.color,
          s.is_initial,
          s.is_terminal,
        ],
      }
    );
  }

  for (const s of SEED.filter((s) => s.parent_code !== null)) {
    await sequelize.query(
      `INSERT INTO stages (code, label_key, name, parent_id, sort_order, icon, color, is_initial, is_terminal, is_system, created_at, updated_at)
       SELECT ?, ?, ?, p.id, ?, ?, ?, ?, ?, 1, NOW(), NOW() FROM stages p WHERE p.code = ?`,
      {
        replacements: [
          s.code,
          s.label_key,
          s.name,
          s.sort_order,
          s.icon,
          s.color,
          s.is_initial,
          s.is_terminal,
          s.parent_code,
        ],
      }
    );
  }

  // 3. Add stage_id column to orders (nullable for backfill)
  await queryInterface.addColumn('orders', 'stage_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'stages', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  // 4. Backfill: orders.status (ENUM) -> stages.code (LOWER match)
  await sequelize.query(
    `UPDATE orders o
     JOIN stages s ON s.code = LOWER(o.status)
     SET o.stage_id = s.id`
  );

  // 5. Sanity check — fail loud if any rows didn't match
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS missing FROM orders WHERE stage_id IS NULL`,
    { type: QueryTypes.RAW }
  );
  const missing = Number((rows as any[])[0]?.missing ?? 0);
  if (missing > 0) {
    throw new Error(
      `Migration 0005 aborted: ${missing} order(s) have a status value that doesn't map to a seeded stage. Inspect orders.status and either fix those rows or extend the SEED list.`
    );
  }

  // 6. Make stage_id NOT NULL now that every row has one
  await queryInterface.changeColumn('orders', 'stage_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'stages', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  // 7. Leave orders.status in place for one release cycle (PR-B drops it).
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.changeColumn('orders', 'stage_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  });
  await queryInterface.removeColumn('orders', 'stage_id');
  await queryInterface.dropTable('stages');
};
