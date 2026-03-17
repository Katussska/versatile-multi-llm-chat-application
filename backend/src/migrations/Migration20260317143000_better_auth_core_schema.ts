import { Migration } from '@mikro-orm/migrations';

export class Migration20260317143000_better_auth_core_schema extends Migration {
  private getAuthSchema(): string {
    return 'public';
  }

  override async up(): Promise<void> {
    const schema = this.getAuthSchema();

    this.addSql(`create schema if not exists "${schema}";`);

    this.addSql(
      `create table if not exists "${schema}"."user" (
        "id" uuid not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "name" text not null,
        "email" text not null,
        "email_verified" boolean not null default false,
        "image" text null,
        "admin" boolean not null default false,
        constraint "${schema}_user_pkey" primary key ("id")
      );`,
    );
    this.addSql(
      `create unique index if not exists "${schema}_user_email_unique" on "${schema}"."user" ("email");`,
    );
    this.addSql(
      `alter table if exists "${schema}"."user" add column if not exists "admin" boolean not null default false;`,
    );

    this.addSql(
      `do $$
      begin
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'user' and column_name = 'createdAt')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'user' and column_name = 'created_at') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'user', 'createdAt', 'created_at');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'user' and column_name = 'updatedAt')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'user' and column_name = 'updated_at') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'user', 'updatedAt', 'updated_at');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'user' and column_name = 'emailVerified')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'user' and column_name = 'email_verified') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'user', 'emailVerified', 'email_verified');
        end if;
      end $$;`,
    );

    this.addSql(
      `create table if not exists "${schema}"."session" (
        "id" uuid not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "user_id" uuid not null,
        "token" text not null,
        "expires_at" timestamptz not null,
        "ip_address" text null,
        "user_agent" text null,
        constraint "${schema}_session_pkey" primary key ("id"),
        constraint "${schema}_session_user_id_foreign" foreign key ("user_id") references "${schema}"."user" ("id") on update cascade on delete cascade
      );`,
    );
    this.addSql(
      `do $$
      begin
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'session' and column_name = 'createdAt')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'session' and column_name = 'created_at') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'session', 'createdAt', 'created_at');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'session' and column_name = 'updatedAt')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'session' and column_name = 'updated_at') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'session', 'updatedAt', 'updated_at');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'session' and column_name = 'userId')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'session' and column_name = 'user_id') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'session', 'userId', 'user_id');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'session' and column_name = 'expiresAt')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'session' and column_name = 'expires_at') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'session', 'expiresAt', 'expires_at');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'session' and column_name = 'ipAddress')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'session' and column_name = 'ip_address') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'session', 'ipAddress', 'ip_address');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'session' and column_name = 'userAgent')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'session' and column_name = 'user_agent') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'session', 'userAgent', 'user_agent');
        end if;
      end $$;`,
    );
    this.addSql(
      `create index if not exists "${schema}_session_user_id_index" on "${schema}"."session" ("user_id");`,
    );
    this.addSql(
      `create unique index if not exists "${schema}_session_token_unique" on "${schema}"."session" ("token");`,
    );

    this.addSql(
      `create table if not exists "${schema}"."account" (
        "id" uuid not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "account_id" text not null,
        "provider_id" text not null,
        "user_id" uuid not null,
        "access_token" text null,
        "refresh_token" text null,
        "id_token" text null,
        "access_token_expires_at" timestamptz null,
        "refresh_token_expires_at" timestamptz null,
        "scope" text null,
        "password" text null,
        constraint "${schema}_account_pkey" primary key ("id"),
        constraint "${schema}_account_user_id_foreign" foreign key ("user_id") references "${schema}"."user" ("id") on update cascade on delete cascade
      );`,
    );
    this.addSql(
      `do $$
      begin
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'createdAt')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'created_at') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'account', 'createdAt', 'created_at');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'updatedAt')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'updated_at') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'account', 'updatedAt', 'updated_at');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'accountId')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'account_id') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'account', 'accountId', 'account_id');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'providerId')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'provider_id') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'account', 'providerId', 'provider_id');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'userId')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'user_id') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'account', 'userId', 'user_id');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'accessToken')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'access_token') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'account', 'accessToken', 'access_token');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'refreshToken')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'refresh_token') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'account', 'refreshToken', 'refresh_token');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'idToken')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'id_token') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'account', 'idToken', 'id_token');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'accessTokenExpiresAt')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'access_token_expires_at') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'account', 'accessTokenExpiresAt', 'access_token_expires_at');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'refreshTokenExpiresAt')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'account' and column_name = 'refresh_token_expires_at') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'account', 'refreshTokenExpiresAt', 'refresh_token_expires_at');
        end if;
      end $$;`,
    );
    this.addSql(
      `create index if not exists "${schema}_account_user_id_index" on "${schema}"."account" ("user_id");`,
    );

    this.addSql(
      `create table if not exists "${schema}"."verification" (
        "id" uuid not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "identifier" text not null,
        "value" text not null,
        "expires_at" timestamptz not null,
        constraint "${schema}_verification_pkey" primary key ("id")
      );`,
    );
    this.addSql(
      `do $$
      begin
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'verification' and column_name = 'createdAt')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'verification' and column_name = 'created_at') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'verification', 'createdAt', 'created_at');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'verification' and column_name = 'updatedAt')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'verification' and column_name = 'updated_at') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'verification', 'updatedAt', 'updated_at');
        end if;
        if exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'verification' and column_name = 'expiresAt')
           and not exists (select 1 from information_schema.columns where table_schema = '${schema}' and table_name = 'verification' and column_name = 'expires_at') then
          execute format('alter table %I.%I rename column %I to %I', '${schema}', 'verification', 'expiresAt', 'expires_at');
        end if;
      end $$;`,
    );
    this.addSql(
      `create index if not exists "${schema}_verification_identifier_index" on "${schema}"."verification" ("identifier");`,
    );
  }

  override async down(): Promise<void> {
    const schema = this.getAuthSchema();

    this.addSql(`drop table if exists "${schema}"."verification" cascade;`);
    this.addSql(`drop table if exists "${schema}"."account" cascade;`);
    this.addSql(`drop table if exists "${schema}"."session" cascade;`);
    this.addSql(`drop table if exists "${schema}"."user" cascade;`);
  }
}
