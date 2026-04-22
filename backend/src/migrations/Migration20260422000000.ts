import { Migration } from '@mikro-orm/migrations';

export class Migration20260422000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "token" alter column "token_count" drop not null;`,
    );
    this.addSql(
      `alter table "message" add column if not exists "cost_usd" float not null default 0;`,
    );
    this.addSql(
      `alter table "model" add column if not exists "price_per_token" float not null default 0;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `update "token" set "token_count" = 0 where "token_count" is null;`,
    );
    this.addSql(`alter table "token" alter column "token_count" set not null;`);
    this.addSql(`alter table "message" drop column if exists "cost_usd";`);
    this.addSql(`alter table "model" drop column if exists "price_per_token";`);
  }
}
