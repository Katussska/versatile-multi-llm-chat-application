import { Migration } from '@mikro-orm/migrations';

export class Migration20260421000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "monthly_limit" integer null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "monthly_limit";`);
  }
}
