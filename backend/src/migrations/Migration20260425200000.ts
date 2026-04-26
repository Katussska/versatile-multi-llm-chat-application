import { Migration } from '@mikro-orm/migrations';

export class Migration20260425200000 extends Migration {
  override async up(): Promise<void> {
    // Soft-delete replaced models
    this.addSql(`
      UPDATE "model" SET deleted_at = NOW()
      WHERE name IN ('gemini-3.0-pro', 'claude-sonnet-4-5', 'claude-opus-4-5', 'gpt-5.4-pro')
      AND deleted_at IS NULL;
    `);

    // Update display labels for retained models
    this.addSql(`
      UPDATE "model" SET display_label = 'ChatGPT 5.5' WHERE name = 'gpt-5.5' AND deleted_at IS NULL;
    `);
    this.addSql(`
      UPDATE "model" SET display_label = 'ChatGPT 5.4 Mini' WHERE name = 'gpt-5.4-mini' AND deleted_at IS NULL;
    `);

    // Insert new models (defaults get early created_at to sort first)
    const newModels = [
      {
        provider: 'gemini',
        name: 'gemini-2.5-flash-lite',
        apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite',
        displayLabel: 'Gemini 2.5 Flash-Lite',
        iconKey: 'gemini',
        isDefault: true,
      },
      {
        provider: 'gemini',
        name: 'gemini-2.5-pro',
        apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro',
        displayLabel: 'Gemini 2.5 Pro',
        iconKey: 'gemini',
        isDefault: false,
      },
      {
        provider: 'anthropic',
        name: 'claude-sonnet-4-6',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        displayLabel: 'Claude Sonnet 4.6',
        iconKey: 'anthropic',
        isDefault: false,
      },
      {
        provider: 'anthropic',
        name: 'claude-opus-4-7',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        displayLabel: 'Claude Opus 4.7',
        iconKey: 'anthropic',
        isDefault: false,
      },
      {
        provider: 'openai',
        name: 'gpt-5.4',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        displayLabel: 'ChatGPT 5.4',
        iconKey: 'openai',
        isDefault: false,
      },
      {
        provider: 'openai',
        name: 'gpt-5.4-nano',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        displayLabel: 'ChatGPT 5.4 Nano',
        iconKey: 'openai',
        isDefault: true,
      },
    ];

    for (const m of newModels) {
      // Default models get a very early timestamp to sort first (createdAt ASC)
      const createdAt = m.isDefault ? "'2026-01-01 00:00:00+00'" : 'NOW()';
      this.addSql(`
        INSERT INTO "model" (id, provider, name, api_endpoint, display_label, icon_key, is_enabled, created_at, updated_at)
        SELECT gen_random_uuid(), '${m.provider}', '${m.name}', '${m.apiEndpoint}', '${m.displayLabel}', '${m.iconKey}', true, ${createdAt}, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM "model" WHERE name = '${m.name}' AND deleted_at IS NULL);
      `);
    }
  }

  override async down(): Promise<void> {
    // Remove new models
    this.addSql(`
      UPDATE "model" SET deleted_at = NOW()
      WHERE name IN ('gemini-2.5-flash-lite', 'gemini-2.5-pro', 'claude-sonnet-4-6', 'claude-opus-4-7', 'gpt-5.4', 'gpt-5.4-nano')
      AND deleted_at IS NULL;
    `);

    // Restore soft-deleted models
    this.addSql(`
      UPDATE "model" SET deleted_at = NULL
      WHERE name IN ('gemini-3.0-pro', 'claude-sonnet-4-5', 'claude-opus-4-5', 'gpt-5.4-pro')
      AND deleted_at IS NOT NULL;
    `);

    // Revert display label changes
    this.addSql(`UPDATE "model" SET display_label = 'GPT-5.5' WHERE name = 'gpt-5.5' AND deleted_at IS NULL;`);
    this.addSql(`UPDATE "model" SET display_label = 'GPT-5.4 Mini' WHERE name = 'gpt-5.4-mini' AND deleted_at IS NULL;`);
  }
}
