import { Migration } from '@mikro-orm/migrations';

export class Migration20260421000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "dollar_limit" float;`);
    this.addSql(
      `alter table "model" add column "price_per_token" float not null default 0;`,
    );
    this.addSql(
      `alter table "message" add column "cost_usd" float not null default 0;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "dollar_limit";`);
    this.addSql(`alter table "model" drop column "price_per_token";`);
    this.addSql(`alter table "message" drop column "cost_usd";`);
  }
}
