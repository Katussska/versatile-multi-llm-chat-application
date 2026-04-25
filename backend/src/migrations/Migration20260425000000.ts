import { Migration } from '@mikro-orm/migrations';

export class Migration20260425000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "model" add column if not exists "display_label" text not null default '';`,
    );
    this.addSql(
      `alter table "model" add column if not exists "icon_key" text not null default '';`,
    );
    this.addSql(
      `alter table "model" add column if not exists "is_enabled" boolean not null default true;`,
    );

    this.addSql(
      `update "model"
       set "name" = 'claude-haiku-4-5-20251001',
           "display_label" = 'Claude Haiku 4.5',
           "icon_key" = 'anthropic'
       where "provider" = 'anthropic' and "deleted_at" is null;`,
    );
    this.addSql(
      `update "model"
       set "display_label" = 'Gemini 2.5 Flash', "icon_key" = 'gemini'
       where "provider" = 'gemini' and "display_label" = '';`,
    );
    this.addSql(
      `update "model" set "display_label" = "name", "icon_key" = "provider"
       where "display_label" = '';`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "model" drop column if exists "display_label";`);
    this.addSql(`alter table "model" drop column if exists "icon_key";`);
    this.addSql(`alter table "model" drop column if exists "is_enabled";`);
  }
}
