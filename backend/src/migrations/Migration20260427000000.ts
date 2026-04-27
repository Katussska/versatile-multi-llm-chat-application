import { Migration } from '@mikro-orm/migrations';

export class Migration20260427000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "message" drop constraint "message_chat_id_foreign";`,
    );
    this.addSql(
      `alter table "message" add constraint "message_chat_id_foreign" foreign key ("chat_id") references "chat" ("id") on delete cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "message" drop constraint "message_chat_id_foreign";`,
    );
    this.addSql(
      `alter table "message" add constraint "message_chat_id_foreign" foreign key ("chat_id") references "chat" ("id");`,
    );
  }
}
