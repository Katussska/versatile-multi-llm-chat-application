import { Migration } from '@mikro-orm/migrations';

export class Migration20260423071626 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create type "user_role" as enum ('USER', 'ADMIN');`);
    this.addSql(
      `alter table "user" add column "role" "user_role" not null default 'USER';`,
    );
    this.addSql(
      `update "user" set "role" = case when "admin" then 'ADMIN'::user_role else 'USER'::user_role end;`,
    );
    this.addSql(
      `alter table "user" drop column "admin", drop column "monthly_limit";`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "user" add column "admin" boolean not null default false, add column "monthly_limit" double precision null;`,
    );
    this.addSql(
      `update "user" set "admin" = ("role" = 'ADMIN'::user_role);`,
    );
    this.addSql(
      `alter table "user" drop column "role";`,
    );
    this.addSql(`drop type "user_role";`);
  }
}
