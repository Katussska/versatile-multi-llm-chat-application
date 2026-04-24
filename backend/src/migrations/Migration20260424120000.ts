import { Migration } from '@mikro-orm/migrations';

export class Migration20260424120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "user" rename column "monthly_dollar_limit" to "monthly_token_limit";`,
    );
    this.addSql(
      `alter table "user" alter column "monthly_token_limit" drop not null;`,
    );
    this.addSql(
      `alter table "user" alter column "monthly_token_limit" drop default;`,
    );
    this.addSql(
      `alter table "user" alter column "monthly_token_limit" type integer using null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "user" rename column "monthly_token_limit" to "monthly_dollar_limit";`,
    );
    this.addSql(
      `alter table "user" alter column "monthly_dollar_limit" type double precision using 5;`,
    );
    this.addSql(
      `alter table "user" alter column "monthly_dollar_limit" set not null;`,
    );
    this.addSql(
      `alter table "user" alter column "monthly_dollar_limit" set default 5;`,
    );
  }
}
