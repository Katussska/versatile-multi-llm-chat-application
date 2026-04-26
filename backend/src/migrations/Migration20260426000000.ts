import { Migration } from '@mikro-orm/migrations';

export class Migration20260426000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE "model_pricing" (
        "id"                          uuid          NOT NULL DEFAULT gen_random_uuid(),
        "created_at"                  timestamptz   NOT NULL DEFAULT now(),
        "updated_at"                  timestamptz   NOT NULL DEFAULT now(),
        "deleted_at"                  timestamptz   NULL,
        "model_id"                    uuid          NOT NULL,
        "input_price"                 numeric(10,6) NOT NULL,
        "output_price"                numeric(10,6) NOT NULL,
        "cache_write_5m_price"        numeric(10,6) NULL,
        "cache_write_1h_price"        numeric(10,6) NULL,
        "cache_read_price"            numeric(10,6) NULL,
        "context_cache_price"         numeric(10,6) NULL,
        "thinking_output_price"       numeric(10,6) NULL,
        "cached_input_price"          numeric(10,6) NULL,
        "input_price_long_ctx"        numeric(10,6) NULL,
        "output_price_long_ctx"       numeric(10,6) NULL,
        "cached_input_price_long_ctx" numeric(10,6) NULL,
        CONSTRAINT "model_pricing_pkey"     PRIMARY KEY ("id"),
        CONSTRAINT "model_pricing_model_id" UNIQUE ("model_id"),
        CONSTRAINT "model_pricing_model_fk" FOREIGN KEY ("model_id") REFERENCES "model" ("id") ON DELETE CASCADE
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "model_pricing";`);
  }
}
