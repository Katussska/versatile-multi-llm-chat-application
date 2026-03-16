const { resolve } = require('node:path');

process.loadEnvFile(resolve(__dirname, '..', '.env'));

const { Client } = require('pg');

function getAuthSchema() {
  const rawSchema = process.env.BETTER_AUTH_SCHEMA ?? 'auth';
  const schema = rawSchema.trim();

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
    throw new Error(
      `Invalid BETTER_AUTH_SCHEMA value "${rawSchema}". Use a valid PostgreSQL schema identifier.`,
    );
  }

  return schema;
}

async function run() {
  const schema = getAuthSchema();
  const client = new Client({
    host: process.env.MIKRO_ORM_HOST ?? 'localhost',
    port: Number(process.env.MIKRO_ORM_PORT ?? 5432),
    database: process.env.MIKRO_ORM_DB_NAME ?? 'cognify',
    user: process.env.MIKRO_ORM_USER ?? 'postgres',
    password: process.env.MIKRO_ORM_PASSWORD ?? 'postgres',
  });

  await client.connect();

  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    console.log(`Better Auth schema ready: ${schema}`);
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
