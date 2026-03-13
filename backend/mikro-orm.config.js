require('dotenv').config();

const { defineConfig } = require('@mikro-orm/postgresql');

/** @type {import('@mikro-orm/core').Options} */
module.exports = defineConfig({
  entities: ['./dist/entities'],
  entitiesTs: ['./src/entities'],
  dbName: process.env.MIKRO_ORM_DB_NAME,
  host: process.env.MIKRO_ORM_HOST,
  password: process.env.MIKRO_ORM_PASSWORD,
  port: Number(process.env.MIKRO_ORM_PORT || 5432),
  user: process.env.MIKRO_ORM_USER,
});
