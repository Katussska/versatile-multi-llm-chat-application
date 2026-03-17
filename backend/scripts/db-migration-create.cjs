const { resolve } = require('node:path');

process.loadEnvFile(resolve(__dirname, '..', '.env'));

const { MikroORM } = require('@mikro-orm/core');
const { PostgreSqlDriver } = require('@mikro-orm/postgresql');
const { Migrator } = require('@mikro-orm/migrations');

function readNameArg() {
  const args = process.argv.slice(2);
  const nameFlagIndex = args.findIndex((arg) => arg === '--name' || arg === '-n');

  if (nameFlagIndex === -1) {
    return undefined;
  }

  return args[nameFlagIndex + 1] || undefined;
}

async function run() {
  const orm = await MikroORM.init({
    driver: PostgreSqlDriver,
    entities: ['./dist/entities'],
    dbName: process.env.MIKRO_ORM_DB_NAME,
    host: process.env.MIKRO_ORM_HOST,
    password: process.env.MIKRO_ORM_PASSWORD,
    port: Number(process.env.MIKRO_ORM_PORT || 5432),
    user: process.env.MIKRO_ORM_USER,
    extensions: [Migrator],
    migrations: {
      path: './dist/migrations',
      pathTs: './src/migrations',
      emit: 'ts',
    },
  });

  try {
    const migration = await orm.migrator.create(undefined, false, false, readNameArg());

    if (migration.diff.up.length === 0) {
      console.log('No schema changes detected.');
      return;
    }

    console.log(`Migration created: ${migration.fileName}`);
    console.log('--- SQL (up) ---');
    console.log(migration.diff.up.join('\n'));
  } finally {
    await orm.close(true);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});