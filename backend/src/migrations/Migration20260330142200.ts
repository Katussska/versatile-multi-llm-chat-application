import { Migration } from '@mikro-orm/migrations';

export class Migration20260330142200 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create extension if not exists "pgcrypto";`);

    this.addSql(`
      create or replace function public.cognify_generate_uuid()
      returns uuid
      language plpgsql
      as $$
      declare
        generated_id uuid;
      begin
        if to_regproc('uuidv7') is not null then
          execute 'select uuidv7()' into generated_id;
          return generated_id;
        end if;

        return gen_random_uuid();
      end;
      $$;
    `);

    this.addSql(
      `alter table "model" alter column "id" set default public.cognify_generate_uuid();`,
    );
    this.addSql(
      `alter table "user" alter column "id" set default public.cognify_generate_uuid();`,
    );
    this.addSql(
      `alter table "token" alter column "id" set default public.cognify_generate_uuid();`,
    );
    this.addSql(
      `alter table "session" alter column "id" set default public.cognify_generate_uuid();`,
    );
    this.addSql(
      `alter table "chat" alter column "id" set default public.cognify_generate_uuid();`,
    );
    this.addSql(
      `alter table "message" alter column "id" set default public.cognify_generate_uuid();`,
    );
    this.addSql(
      `alter table "account" alter column "id" set default public.cognify_generate_uuid();`,
    );
    this.addSql(
      `alter table "verification" alter column "id" set default public.cognify_generate_uuid();`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "model" alter column "id" drop default;`);
    this.addSql(`alter table "user" alter column "id" drop default;`);
    this.addSql(`alter table "token" alter column "id" drop default;`);
    this.addSql(`alter table "session" alter column "id" drop default;`);
    this.addSql(`alter table "chat" alter column "id" drop default;`);
    this.addSql(`alter table "message" alter column "id" drop default;`);
    this.addSql(`alter table "account" alter column "id" drop default;`);
    this.addSql(`alter table "verification" alter column "id" drop default;`);

    this.addSql(`drop function if exists public.cognify_generate_uuid();`);
  }
}
