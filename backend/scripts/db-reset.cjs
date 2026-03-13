require('dotenv').config();

const { MikroORM } = require('@mikro-orm/postgresql');
const mikroOrmConfig = require('../mikro-orm.config.js');

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);

function isTruthy(value) {
  return TRUTHY_VALUES.has(String(value ?? '').trim().toLowerCase());
}

function assertSafeResetEnvironment(config) {
  const currentEnv = process.env.NODE_ENV ?? 'development';
  const hasResetConfirmation = isTruthy(process.env.DB_RESET_CONFIRM);
  const allowOutsideDevelopment = isTruthy(
    process.env.DB_RESET_ALLOW_NON_DEVELOPMENT,
  );

  if (!hasResetConfirmation) {
    throw new Error(
      'Refusing to reset schema without DB_RESET_CONFIRM=true. ' +
        'This prevents accidental destructive operations.',
    );
  }

  if (currentEnv !== 'development' && !allowOutsideDevelopment) {
    throw new Error(
      `Refusing to reset schema in NODE_ENV=${currentEnv}. ` +
        'Set DB_RESET_ALLOW_NON_DEVELOPMENT=true only if you intentionally want this.',
    );
  }

  const dbName = config.dbName ?? '(unknown)';
  console.warn(`Resetting database schema for "${dbName}" in NODE_ENV=${currentEnv}`);
}

async function run() {
  assertSafeResetEnvironment(mikroOrmConfig);

  const orm = await MikroORM.init(mikroOrmConfig);

  try {
    await orm.schema.refresh();
    console.log('Schema successfully dropped and recreated');
  } finally {
    await orm.close(true);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
