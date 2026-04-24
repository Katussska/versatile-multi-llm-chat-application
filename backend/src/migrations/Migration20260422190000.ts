import { Migration } from '@mikro-orm/migrations';

export class Migration20260422190000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "usage_log" ("id" uuid not null, "user_id" uuid not null, "model_name" text not null, "prompt_tokens" int null, "completion_tokens" int null, "total_cost" double precision not null default 0, "created_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `create index "usage_log_user_id_index" on "usage_log" ("user_id");`,
    );
    this.addSql(
      `create index "usage_log_user_id_created_at_index" on "usage_log" ("user_id", "created_at");`,
    );
    this.addSql(
      `alter table "usage_log" add constraint "usage_log_user_id_foreign" foreign key ("user_id") references "user" ("id") on delete cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "usage_log" cascade;`);
  }
}
