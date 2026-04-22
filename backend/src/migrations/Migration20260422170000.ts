import { Migration } from '@mikro-orm/migrations';

export class Migration20260422170000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "user" alter column "monthly_limit" type double precision using "monthly_limit"::double precision;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "user" alter column "monthly_limit" type integer using round("monthly_limit")::integer;`,
    );
  }
}
