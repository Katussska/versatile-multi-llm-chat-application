import { Migration } from '@mikro-orm/migrations';

export class Migration20260426400000 extends Migration {
  override async up(): Promise<void> {
    // Backfill cost for historical usage_log records that predate the cost column.
    // Only updates rows where:
    //   - cost IS NULL (not yet calculated)
    //   - both token counts are present (enough data to compute)
    //   - a matching model_pricing row exists (no invented numbers)
    // Cache columns (cache_write_tokens, cache_read_tokens, cached_input_tokens)
    // were added in Migration20260426300000 and are NULL for all these records,
    // so the simple input+output formula is the correct one to use.
    this.addSql(`
      UPDATE usage_log ul
      SET cost = (
        COALESCE(ul.prompt_tokens, 0)::numeric / 1000000 * mp.input_price
        + COALESCE(ul.completion_tokens, 0)::numeric / 1000000 * mp.output_price
      )
      FROM model m
      JOIN model_pricing mp ON mp.model_id = m.id
      WHERE ul.model_name = m.name
        AND m.deleted_at IS NULL
        AND ul.cost IS NULL
        AND ul.prompt_tokens IS NOT NULL
        AND ul.completion_tokens IS NOT NULL;
    `);
  }

  override async down(): Promise<void> {
    // Revert backfilled costs: only clears cost on rows where cache columns are
    // still NULL (i.e. rows that existed before Migration20260426300000), which
    // are the exact rows this migration touched.
    this.addSql(`
      UPDATE usage_log
      SET cost = NULL
      WHERE cost IS NOT NULL
        AND cache_write_tokens IS NULL
        AND cache_read_tokens IS NULL
        AND cached_input_tokens IS NULL;
    `);
  }
}
