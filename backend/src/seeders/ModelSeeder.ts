import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Model } from '../entities/Model';

function getEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

const MODELS = [
  {
    provider: 'gemini',
    name: () => getEnv('GEMINI_MODEL', 'gemini-2.5-flash'),
    apiEndpoint: (name: string) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${name}`,
  },
  {
    provider: 'anthropic',
    name: () => getEnv('ANTHROPIC_MODEL', 'claude-3-haiku-20240307'),
    apiEndpoint: () => 'https://api.anthropic.com/v1/messages',
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
        });
        em.persist(model);
        console.info(`Seeded model: ${def.provider}/${modelName}`);
      } else {
        console.info(`Model already exists, skipping: ${def.provider}/${modelName}`);
      }
    }

    await em.flush();
  }
}
