import { Migration } from '@mikro-orm/migrations';

export class Migration20260424000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "message" drop column "cost_usd";`);
    this.addSql(`alter table "usage_log" drop column "total_cost";`);
    this.addSql(`alter table "model" drop column "price_per_token";`);
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "message" add column "cost_usd" double precision not null default 0;`,
    );
    this.addSql(
      `alter table "usage_log" add column "total_cost" double precision not null default 0;`,
    );
    this.addSql(
      `alter table "model" add column "price_per_token" double precision not null default 0;`,
    );
  }
}
