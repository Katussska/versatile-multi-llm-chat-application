import { Migration } from '@mikro-orm/migrations';

export class Migration20260426300000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "usage_log"
        ADD COLUMN "cache_write_tokens" integer NULL,
        ADD COLUMN "cache_read_tokens" integer NULL,
        ADD COLUMN "cached_input_tokens" integer NULL;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "usage_log"
        DROP COLUMN "cache_write_tokens",
        DROP COLUMN "cache_read_tokens",
        DROP COLUMN "cached_input_tokens";
    `);
  }
}
