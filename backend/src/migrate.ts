import umzug from './umzug';

async function migrate() {
  console.log('Running pending migrations...');
  const migrations = await umzug.up();
  if (migrations.length > 0) {
    console.log(`Applied ${migrations.length} migration(s):`, migrations.map(m => m.name));
  } else {
    console.log('No pending migrations.');
  }
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
