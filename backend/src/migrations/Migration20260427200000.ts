import { Migration } from '@mikro-orm/migrations';

export class Migration20260427200000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_email_unique";`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX "user_email_active_unique" ON "user" ("email") WHERE "deleted_at" IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "user_email_active_unique";`);
    this.addSql(
      `ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE ("email");`,
    );
  }
}
