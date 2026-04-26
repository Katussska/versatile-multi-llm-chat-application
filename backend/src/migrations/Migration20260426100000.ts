import { Migration } from '@mikro-orm/migrations';

export class Migration20260426100000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "model_pricing"
        ADD COLUMN "context_cache_price_long_ctx"  numeric(10,6) NULL,
        ADD COLUMN "context_cache_storage_price"   numeric(10,6) NULL;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "model_pricing"
        DROP COLUMN "context_cache_price_long_ctx",
        DROP COLUMN "context_cache_storage_price";
    `);
  }
}
