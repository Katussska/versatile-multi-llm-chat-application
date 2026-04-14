import { Migration } from '@mikro-orm/migrations';

export class Migration20260413000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "model" add column "deleted_at" timestamptz null;`,
    );
    this.addSql(`alter table "user" add column "deleted_at" timestamptz null;`);
    this.addSql(
      `alter table "token" add column "deleted_at" timestamptz null;`,
    );
    this.addSql(
      `alter table "session" add column "deleted_at" timestamptz null;`,
    );
    this.addSql(`alter table "chat" add column "deleted_at" timestamptz null;`);
    this.addSql(
      `alter table "message" add column "deleted_at" timestamptz null;`,
    );
    this.addSql(
      `alter table "account" add column "deleted_at" timestamptz null;`,
    );
    this.addSql(
      `alter table "verification" add column "deleted_at" timestamptz null;`,
    );
  }
}
