import { Migration } from '@mikro-orm/migrations';

export class Migration20260427100000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "usage_log" DROP CONSTRAINT IF EXISTS "usage_log_user_id_foreign";`,
    );
    this.addSql(
      `ALTER TABLE "usage_log" ALTER COLUMN "user_id" DROP NOT NULL;`,
    );
    this.addSql(
      `ALTER TABLE "usage_log" ADD CONSTRAINT "usage_log_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE SET NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE "usage_log" DROP CONSTRAINT IF EXISTS "usage_log_user_id_foreign";`,
    );
    this.addSql(
      `UPDATE "usage_log" SET "user_id" = NULL WHERE "user_id" NOT IN (SELECT "id" FROM "user");`,
    );
    this.addSql(
      `ALTER TABLE "usage_log" ALTER COLUMN "user_id" SET NOT NULL;`,
    );
    this.addSql(
      `ALTER TABLE "usage_log" ADD CONSTRAINT "usage_log_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE;`,
    );
  }
}
