import { Migration } from '@mikro-orm/migrations';

export class Migration20260422100000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "message" alter column "parent_message_id" type uuid using "parent_message_id"::uuid;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "message" alter column "parent_message_id" type text using "parent_message_id"::text;`,
    );
  }
}
