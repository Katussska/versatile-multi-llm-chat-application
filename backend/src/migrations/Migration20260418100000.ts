import { Migration } from '@mikro-orm/migrations';

export class Migration20260418100000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "chat" add column "favourite" boolean not null default false;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "chat" drop column "favourite";`);
  }
}
