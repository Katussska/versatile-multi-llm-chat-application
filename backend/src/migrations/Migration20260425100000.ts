import { Migration } from '@mikro-orm/migrations';

export class Migration20260425100000 extends Migration {
  override async up(): Promise<void> {
    const newModels = [
      {
        provider: 'gemini',
        name: 'gemini-2.5-flash',
        apiEndpoint:
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash',
        displayLabel: 'Gemini 2.5 Flash',
        iconKey: 'gemini',
      },
      {
        provider: 'gemini',
        name: 'gemini-3.0-pro',
        apiEndpoint:
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-pro',
        displayLabel: 'Gemini 3 Pro',
        iconKey: 'gemini',
      },
      {
        provider: 'anthropic',
        name: 'claude-sonnet-4-5',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        displayLabel: 'Claude Sonnet 4.5',
        iconKey: 'anthropic',
      },
      {
        provider: 'anthropic',
        name: 'claude-opus-4-5',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        displayLabel: 'Claude Opus 4.5',
        iconKey: 'anthropic',
      },
      {
        provider: 'openai',
        name: 'gpt-5.5',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        displayLabel: 'GPT-5.5',
        iconKey: 'openai',
      },
      {
        provider: 'openai',
        name: 'gpt-5.4-pro',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        displayLabel: 'GPT-5.4 Pro',
        iconKey: 'openai',
      },
    ];

    for (const m of newModels) {
      this.addSql(`
        INSERT INTO "model" (id, provider, name, api_endpoint, display_label, icon_key, is_enabled, created_at, updated_at)
        SELECT gen_random_uuid(), '${m.provider}', '${m.name}', '${m.apiEndpoint}', '${m.displayLabel}', '${m.iconKey}', true, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM "model" WHERE name = '${m.name}' AND deleted_at IS NULL);
      `);
    }
  }

  override async down(): Promise<void> {
    this.addSql(`
      UPDATE "model" SET deleted_at = NOW()
      WHERE name IN ('gemini-2.5-flash', 'gemini-3.0-pro', 'claude-sonnet-4-5', 'claude-opus-4-5', 'gpt-5.5', 'gpt-5.4-pro')
      AND deleted_at IS NULL;
    `);
  }
}
