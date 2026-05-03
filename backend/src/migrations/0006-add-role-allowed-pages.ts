import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.addColumn('roles', 'allowed_pages', {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  });

  // Backfill existing rows so the new field is non-null with sensible defaults.
  // Admin → wildcard (sees every page, including future ones).
  // Other system roles get an area-scoped default that mirrors what the seed
  // script would set on a fresh install.
  const sequelize = queryInterface.sequelize;
  await sequelize.query(
    `UPDATE roles SET allowed_pages = ? WHERE role_name = 'Admin'`,
    { replacements: [JSON.stringify(['*'])] }
  );
  await sequelize.query(
    `UPDATE roles SET allowed_pages = ? WHERE role_name IN ('Sales', 'Designer')`,
    { replacements: [JSON.stringify(['office.dashboard', 'office.orders', 'office.settings'])] }
  );
  await sequelize.query(
    `UPDATE roles SET allowed_pages = ? WHERE role_name IN ('Cutter', 'Painter')`,
    { replacements: [JSON.stringify(['factory.tasks', 'factory.qa_report', 'factory.settings'])] }
  );
  await sequelize.query(
    `UPDATE roles SET allowed_pages = ? WHERE role_name = 'Installer'`,
    { replacements: [JSON.stringify(['field.schedule', 'field.fleet_checkout', 'field.settings'])] }
  );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.removeColumn('roles', 'allowed_pages');
};
