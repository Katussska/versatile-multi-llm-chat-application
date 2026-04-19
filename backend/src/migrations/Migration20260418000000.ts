import { Migration } from '@mikro-orm/migrations';

export class Migration20260418000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "message" add column "parent_message_id" text null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "message" drop column "parent_message_id";`,
    );
  }
}
