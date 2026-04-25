import { Migration } from '@mikro-orm/migrations';

export class Migration20260424213000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "usage_log" add column if not exists "model_key" text;`,
    );

    // Backfill usage rows with safe defaults for legacy data.
    this.addSql(
      `update "usage_log"
       set "model_key" = coalesce(nullif(trim("model_name"), ''), 'unknown')
       where "model_key" is null;`,
    );
    this.addSql(
      `update "usage_log"
       set "model_provider" = coalesce(nullif(trim("model_provider"), ''), 'unknown')
       where "model_provider" is null or trim("model_provider") = '';`,
    );

    // Backfill message metadata from chat->model mapping and keep safe fallback.
    this.addSql(
      `update "message" m
       set "model_key" = coalesce(m."model_key", md."name", 'legacy'),
           "model_provider" = coalesce(m."model_provider", md."provider", 'legacy')
       from "chat" c
       left join "model" md on c."model_id" = md."id"
       where m."chat_id" = c."id"
         and (m."model_key" is null or m."model_provider" is null);`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "usage_log" drop column if exists "model_key";`);
  }
}
