import { Migration } from '@mikro-orm/migrations';

export class Migration20260319125453 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "model" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "provider" varchar(255) not null, "name" varchar(255) not null, "api_endpoint" varchar(255) not null, primary key ("id"));`);

    this.addSql(`create table "user" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" text not null, "email" text not null, "email_verified" boolean not null default false, "image" text null, "admin" boolean not null default false, primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`create table "token" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "model_id" uuid not null, "user_id" uuid not null, "token_count" int not null, "used_tokens" int not null default 0, "reset_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "session" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_id" uuid not null, "token" text not null, "expires_at" timestamptz not null, "ip_address" text null, "user_agent" text null, primary key ("id"));`);
    this.addSql(`create index "session_user_id_index" on "session" ("user_id");`);
    this.addSql(`alter table "session" add constraint "session_token_unique" unique ("token");`);

    this.addSql(`create table "chat" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "model_id" uuid not null, "user_id" uuid not null, "title" varchar(255) not null, primary key ("id"));`);

    this.addSql(`create table "message" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "chat_id" uuid not null, "favourite" boolean not null default false, "content" text not null, "path" text not null, primary key ("id"));`);

    this.addSql(`create table "account" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "account_id" text not null, "provider_id" text not null, "user_id" uuid not null, "access_token" text null, "refresh_token" text null, "id_token" text null, "access_token_expires_at" timestamptz null, "refresh_token_expires_at" timestamptz null, "scope" text null, "password" text null, primary key ("id"));`);
    this.addSql(`create index "account_user_id_index" on "account" ("user_id");`);

    this.addSql(`create table "verification" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "identifier" text not null, "value" text not null, "expires_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "verification_identifier_index" on "verification" ("identifier");`);

    this.addSql(`alter table "token" add constraint "token_model_id_foreign" foreign key ("model_id") references "model" ("id");`);
    this.addSql(`alter table "token" add constraint "token_user_id_foreign" foreign key ("user_id") references "user" ("id");`);

    this.addSql(`alter table "session" add constraint "session_user_id_foreign" foreign key ("user_id") references "user" ("id") on delete cascade;`);

    this.addSql(`alter table "chat" add constraint "chat_model_id_foreign" foreign key ("model_id") references "model" ("id");`);
    this.addSql(`alter table "chat" add constraint "chat_user_id_foreign" foreign key ("user_id") references "user" ("id");`);

    this.addSql(`alter table "message" add constraint "message_chat_id_foreign" foreign key ("chat_id") references "chat" ("id");`);

    this.addSql(`alter table "account" add constraint "account_user_id_foreign" foreign key ("user_id") references "user" ("id") on delete cascade;`);
  }

}
