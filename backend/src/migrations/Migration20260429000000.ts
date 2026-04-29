import { Migration } from '@mikro-orm/migrations';

export class Migration20260429000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`DELETE FROM "token";`);
    this.addSql(`ALTER TABLE "token" DROP COLUMN IF EXISTS "model_id";`);
    this.addSql(`ALTER TABLE "token" ADD CONSTRAINT "token_user_id_unique" UNIQUE ("user_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "token" DROP CONSTRAINT IF EXISTS "token_user_id_unique";`);
    this.addSql(`ALTER TABLE "token" ADD COLUMN "model_id" uuid REFERENCES "model" ("id") ON DELETE CASCADE;`);
  }
}
