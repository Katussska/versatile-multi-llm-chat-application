import { resolve } from 'node:path';
import { defineConfig } from '@mikro-orm/postgresql';
import { EntitySchema } from '@mikro-orm/core';

process.loadEnvFile(resolve(import.meta.dirname, '.env'));

const MigrationPlaceholderEntity = new EntitySchema({
  name: 'MigrationPlaceholderEntity',
  tableName: '__migration_placeholder_entity',
  properties: {
    id: {
      type: 'uuid',
      primary: true,
    },
  },
});

export default defineConfig({
  entities: [MigrationPlaceholderEntity],
  dbName: process.env.MIKRO_ORM_DB_NAME,
  host: process.env.MIKRO_ORM_HOST,
  password: process.env.MIKRO_ORM_PASSWORD,
  port: Number(process.env.MIKRO_ORM_PORT || 5432),
  user: process.env.MIKRO_ORM_USER,
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
    emit: 'ts',
  },
});