import { Migration } from '@mikro-orm/migrations';

export class Migration20260430000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "message" ADD COLUMN "version_group_id" uuid DEFAULT NULL;`);
    this.addSql(`ALTER TABLE "message" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true;`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "message" DROP COLUMN "is_active";`);
    this.addSql(`ALTER TABLE "message" DROP COLUMN "version_group_id";`);
  }
}
