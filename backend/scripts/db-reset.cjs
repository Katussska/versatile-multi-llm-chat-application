require('dotenv').config();

const { MikroORM } = require('@mikro-orm/postgresql');
const mikroOrmConfig = require('../mikro-orm.config.js');

async function run() {
  const orm = await MikroORM.init(mikroOrmConfig);

  try {
    await orm.schema.refresh({ dropDb: true });
    console.log('Schema successfully dropped and recreated');
  } finally {
    await orm.close(true);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
