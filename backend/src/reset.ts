/**
 * Wipe every domain table back to its post-seed baseline.
 *
 * Preserves: the 6 system roles, the 6 demo users (admin@/sarah@/derek@/carl@/
 * paula@/ian@woodflow.com), and the system stage tree (is_system = true).
 *
 * Usage: `npm run db:reset`
 *
 * After resetting you can re-run `npm run seed:massive` to repopulate, or
 * leave it bare for clean-room testing.
 */
import sequelize from './config/database';

const SEED_USER_EMAILS = [
  'admin@woodflow.com',
  'sarah@woodflow.com',
  'derek@woodflow.com',
  'carl@woodflow.com',
  'paula@woodflow.com',
  'ian@woodflow.com',
];

// Order matters even with FK_CHECKS=0 because we want a clean console output
// of the row counts. Tables with FKs to soon-to-be-truncated parents go first.
const TRUNCATE_ORDER = [
  'notifications',
  'attendance',
  'order_files',
  'signatures',
  'design_files',
  'measurements',
  'bom_items',
  'quotes',
  'cnc_exports',
  'vehicle_services',
  'purchase_orders',
  'orders',
  'fleet',
  'inventory',
];

async function rowCount(table: string): Promise<number> {
  const [rows]: any = await sequelize.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
  return Number(rows[0]?.n || 0);
}

async function main() {
  await sequelize.authenticate();
  console.log('▶ Resetting domain tables…');

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const table of TRUNCATE_ORDER) {
      try {
        const before = await rowCount(table);
        await sequelize.query(`TRUNCATE TABLE \`${table}\``);
        console.log(`  ✓ ${table.padEnd(20)} (-${before} rows)`);
      } catch (err: any) {
        // Table might not exist (e.g. if migrations haven't all run); skip.
        if (err?.original?.code === 'ER_NO_SUCH_TABLE') {
          console.log(`  · ${table.padEnd(20)} (not present, skipped)`);
          continue;
        }
        throw err;
      }
    }

    // Delete non-seed users + non-system stages — can't TRUNCATE because we
    // need to preserve specific rows.
    const placeholders = SEED_USER_EMAILS.map(() => '?').join(',');
    const [usersBefore]: any = await sequelize.query(`SELECT COUNT(*) AS n FROM users`);
    await sequelize.query(`DELETE FROM users WHERE email NOT IN (${placeholders})`, {
      replacements: SEED_USER_EMAILS,
    });
    const [usersAfter]: any = await sequelize.query(`SELECT COUNT(*) AS n FROM users`);
    console.log(
      `  ✓ ${'users'.padEnd(20)} (-${
        Number(usersBefore[0].n) - Number(usersAfter[0].n)
      } rows, kept ${usersAfter[0].n})`
    );

    const [stagesBefore]: any = await sequelize.query(`SELECT COUNT(*) AS n FROM stages`);
    await sequelize.query(`DELETE FROM stages WHERE is_system = false`);
    const [stagesAfter]: any = await sequelize.query(`SELECT COUNT(*) AS n FROM stages`);
    console.log(
      `  ✓ ${'stages'.padEnd(20)} (-${
        Number(stagesBefore[0].n) - Number(stagesAfter[0].n)
      } rows, kept ${stagesAfter[0].n} system rows)`
    );

    // device_tokens deliberately NOT touched — those are owned by physical
    // devices and the user might want to keep mobile sessions alive.
  } finally {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  console.log('\n✅ Reset complete. Run `npm run seed:massive` to repopulate.');
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
