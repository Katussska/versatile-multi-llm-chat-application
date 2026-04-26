import { Migration } from '@mikro-orm/migrations';

export class Migration20260426200000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "token"
        RENAME COLUMN "token_count" TO "dollar_limit";
    `);
    this.addSql(`
      ALTER TABLE "token"
        ALTER COLUMN "dollar_limit" TYPE numeric(10,6) USING dollar_limit::numeric;
    `);
    this.addSql(`
      ALTER TABLE "token"
        RENAME COLUMN "used_tokens" TO "used_dollars";
    `);
    this.addSql(`
      ALTER TABLE "token"
        ALTER COLUMN "used_dollars" TYPE numeric(10,6) USING used_dollars::numeric;
    `);
    this.addSql(`
      ALTER TABLE "usage_log"
        ADD COLUMN "cost" numeric(10,6) NULL;
    `);
    this.addSql(`
      ALTER TABLE "user"
        DROP COLUMN IF EXISTS "monthly_token_limit";
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "token"
        RENAME COLUMN "dollar_limit" TO "token_count";
    `);
    this.addSql(`
      ALTER TABLE "token"
        ALTER COLUMN "token_count" TYPE integer USING token_count::integer;
    `);
    this.addSql(`
      ALTER TABLE "token"
        RENAME COLUMN "used_dollars" TO "used_tokens";
    `);
    this.addSql(`
      ALTER TABLE "token"
        ALTER COLUMN "used_tokens" TYPE integer USING used_tokens::integer;
    `);
    this.addSql(`
      ALTER TABLE "usage_log"
        DROP COLUMN "cost";
    `);
    this.addSql(`
      ALTER TABLE "user"
        ADD COLUMN "monthly_token_limit" integer NULL;
    `);
  }
}
