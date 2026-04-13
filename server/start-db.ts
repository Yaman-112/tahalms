import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'pgdata');

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port: 51214,
  persistent: true,
});

async function main() {
  console.log('Starting embedded PostgreSQL on port 51214...');
  await pg.initialise();
  await pg.start();
  console.log('PostgreSQL is running.');

  // Create the database if it doesn't exist
  try {
    await pg.createDatabase('tahacanvas');
    console.log('Database "tahacanvas" created.');
  } catch {
    console.log('Database "tahacanvas" already exists.');
  }

  console.log('Press Ctrl+C to stop.');

  process.on('SIGINT', async () => {
    console.log('\nStopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await pg.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Failed to start PostgreSQL:', err);
  process.exit(1);
});
