import { Migration } from '@mikro-orm/migrations';

export class Migration20260424200000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "message" add column if not exists "model_key" text;`);
    this.addSql(`alter table "message" add column if not exists "model_provider" text;`);
    this.addSql(`alter table "usage_log" add column if not exists "model_provider" text;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "message" drop column if exists "model_key";`);
    this.addSql(`alter table "message" drop column if exists "model_provider";`);
    this.addSql(`alter table "usage_log" drop column if exists "model_provider";`);
  }
}
