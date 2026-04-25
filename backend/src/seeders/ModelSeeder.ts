import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Model } from '../entities/Model';

const MODELS = [
  {
    provider: 'gemini',
    name: () => 'gemini-2.5-flash',
    displayLabel: 'Gemini 2.5 Flash',
    iconKey: 'gemini',
    apiEndpoint: (name: string) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${name}`,
  },
  {
    provider: 'anthropic',
    name: () => 'claude-haiku-4-5-20251001',
    displayLabel: 'Claude Haiku 4.5',
    iconKey: 'anthropic',
    apiEndpoint: () => 'https://api.anthropic.com/v1/messages',
  },
  {
    provider: 'openai',
    name: () => 'gpt-5.4-mini',
    displayLabel: 'GPT-5.4 Mini',
    iconKey: 'openai',
    apiEndpoint: () => 'https://api.openai.com/v1/chat/completions',
  },
];

export class ModelSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const def of MODELS) {
      const modelName = def.name();
      const existing = await em.findOne(Model, {
        provider: def.provider,
        name: modelName,
        deletedAt: null,
      });

      if (!existing) {
        const model = em.create(Model, {
          provider: def.provider,
          name: modelName,
          apiEndpoint: def.apiEndpoint(modelName),
          displayLabel: def.displayLabel,
          iconKey: def.iconKey,
          isEnabled: true,
        });
        em.persist(model);
        console.info(`Seeded model: ${def.provider}/${modelName}`);
      } else {
        existing.displayLabel = def.displayLabel;
        existing.iconKey = def.iconKey;
        console.info(`Updated model metadata: ${def.provider}/${modelName}`);
      }
    }

    await em.flush();

    const currentNames = MODELS.map((m) => m.name());
    const staleModels = await em.find(Model, {
      name: { $nin: currentNames },
      deletedAt: null,
    });
    for (const m of staleModels) {
      m.deletedAt = new Date();
      console.info(`Soft-deleted stale model: ${m.provider}/${m.name}`);
    }
    if (staleModels.length > 0) await em.flush();
  }
}
