import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Model } from '../entities/Model';
import { ModelPricing } from '../entities/ModelPricing';

type PricingDef = {
  inputPrice: number;
  outputPrice: number;
  cacheWrite5mPrice?: number;
  cacheWrite1hPrice?: number;
  cacheReadPrice?: number;
  contextCachePrice?: number;
  thinkingOutputPrice?: number;
  cachedInputPrice?: number;
  inputPriceLongCtx?: number;
  outputPriceLongCtx?: number;
  cachedInputPriceLongCtx?: number;
};

const MODELS: {
  provider: string;
  name: string;
  displayLabel: string;
  iconKey: string;
  apiEndpoint: (name: string) => string;
  pricing: PricingDef;
}[] = [
  {
    provider: 'gemini',
    name: 'gemini-2.5-flash-lite',
    displayLabel: 'Gemini 2.5 Flash-Lite',
    iconKey: 'gemini',
    apiEndpoint: (name: string) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${name}`,
    pricing: {
      inputPrice: 0.1,
      outputPrice: 0.4,
    },
  },
  {
    provider: 'gemini',
    name: 'gemini-2.5-flash',
    displayLabel: 'Gemini 2.5 Flash',
    iconKey: 'gemini',
    apiEndpoint: (name: string) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${name}`,
    pricing: {
      inputPrice: 0.15,
      outputPrice: 0.6,
      thinkingOutputPrice: 1.0,
      contextCachePrice: 0.0375,
    },
  },
  {
    provider: 'gemini',
    name: 'gemini-2.5-pro',
    displayLabel: 'Gemini 2.5 Pro',
    iconKey: 'gemini',
    apiEndpoint: (name: string) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${name}`,
    pricing: {
      inputPrice: 1.25,
      outputPrice: 10.0,
      thinkingOutputPrice: 3.5,
      contextCachePrice: 0.3125,
      inputPriceLongCtx: 2.5,
      outputPriceLongCtx: 10.0,
    },
  },
  {
    provider: 'anthropic',
    name: 'claude-haiku-4-5-20251001',
    displayLabel: 'Claude Haiku 4.5',
    iconKey: 'anthropic',
    apiEndpoint: () => 'https://api.anthropic.com/v1/messages',
    pricing: {
      inputPrice: 0.8,
      outputPrice: 4.0,
      cacheWrite5mPrice: 1.0,
      cacheWrite1hPrice: 1.2,
      cacheReadPrice: 0.08,
    },
  },
  {
    provider: 'anthropic',
    name: 'claude-sonnet-4-5',
    displayLabel: 'Claude Sonnet 4.5',
    iconKey: 'anthropic',
    apiEndpoint: () => 'https://api.anthropic.com/v1/messages',
    pricing: {
      inputPrice: 3.0,
      outputPrice: 15.0,
      cacheWrite5mPrice: 3.75,
      cacheWrite1hPrice: 4.5,
      cacheReadPrice: 0.3,
    },
  },
  {
    provider: 'anthropic',
    name: 'claude-opus-4-7',
    displayLabel: 'Claude Opus 4.7',
    iconKey: 'anthropic',
    apiEndpoint: () => 'https://api.anthropic.com/v1/messages',
    pricing: {
      inputPrice: 15.0,
      outputPrice: 75.0,
      cacheWrite5mPrice: 18.75,
      cacheWrite1hPrice: 22.5,
      cacheReadPrice: 1.5,
    },
  },
  {
    provider: 'openai',
    name: 'gpt-5.4-nano',
    displayLabel: 'ChatGPT 5.4 Nano',
    iconKey: 'openai',
    apiEndpoint: () => 'https://api.openai.com/v1/chat/completions',
    pricing: {
      inputPrice: 0.1,
      outputPrice: 0.4,
      cachedInputPrice: 0.05,
    },
  },
  {
    provider: 'openai',
    name: 'gpt-5.4-mini',
    displayLabel: 'ChatGPT 5.4 Mini',
    iconKey: 'openai',
    apiEndpoint: () => 'https://api.openai.com/v1/chat/completions',
    pricing: {
      inputPrice: 0.4,
      outputPrice: 1.6,
      cachedInputPrice: 0.2,
    },
  },
  {
    provider: 'openai',
    name: 'gpt-5.5',
    displayLabel: 'ChatGPT 5.5',
    iconKey: 'openai',
    apiEndpoint: () => 'https://api.openai.com/v1/chat/completions',
    pricing: {
      inputPrice: 10.0,
      outputPrice: 30.0,
      cachedInputPrice: 5.0,
    },
  },
  {
    provider: 'openai',
    name: 'gpt-5.4',
    displayLabel: 'ChatGPT 5.4',
    iconKey: 'openai',
    apiEndpoint: () => 'https://api.openai.com/v1/chat/completions',
    pricing: {
      inputPrice: 2.5,
      outputPrice: 10.0,
      cachedInputPrice: 1.25,
    },
  },
];

export class ModelSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const def of MODELS) {
      const modelName = def.name;
      let model = await em.findOne(Model, {
        provider: def.provider,
        name: modelName,
        deletedAt: null,
      });

      if (!model) {
        model = em.create(Model, {
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
        model.displayLabel = def.displayLabel;
        model.iconKey = def.iconKey;
        console.info(`Updated model metadata: ${def.provider}/${modelName}`);
      }

      await em.flush();

      const existingPricing = await em.findOne(ModelPricing, { model });
      if (!existingPricing) {
        const pricing = em.create(ModelPricing, {
          model,
          inputPrice: def.pricing.inputPrice,
          outputPrice: def.pricing.outputPrice,
          cacheWrite5mPrice: def.pricing.cacheWrite5mPrice ?? null,
          cacheWrite1hPrice: def.pricing.cacheWrite1hPrice ?? null,
          cacheReadPrice: def.pricing.cacheReadPrice ?? null,
          contextCachePrice: def.pricing.contextCachePrice ?? null,
          thinkingOutputPrice: def.pricing.thinkingOutputPrice ?? null,
          cachedInputPrice: def.pricing.cachedInputPrice ?? null,
          inputPriceLongCtx: def.pricing.inputPriceLongCtx ?? null,
          outputPriceLongCtx: def.pricing.outputPriceLongCtx ?? null,
          cachedInputPriceLongCtx: def.pricing.cachedInputPriceLongCtx ?? null,
        });
        em.persist(pricing);
        console.info(`Seeded pricing for: ${def.provider}/${modelName}`);
      } else {
        existingPricing.inputPrice = def.pricing.inputPrice;
        existingPricing.outputPrice = def.pricing.outputPrice;
        existingPricing.cacheWrite5mPrice = def.pricing.cacheWrite5mPrice ?? null;
        existingPricing.cacheWrite1hPrice = def.pricing.cacheWrite1hPrice ?? null;
        existingPricing.cacheReadPrice = def.pricing.cacheReadPrice ?? null;
        existingPricing.contextCachePrice = def.pricing.contextCachePrice ?? null;
        existingPricing.thinkingOutputPrice = def.pricing.thinkingOutputPrice ?? null;
        existingPricing.cachedInputPrice = def.pricing.cachedInputPrice ?? null;
        existingPricing.inputPriceLongCtx = def.pricing.inputPriceLongCtx ?? null;
        existingPricing.outputPriceLongCtx = def.pricing.outputPriceLongCtx ?? null;
        existingPricing.cachedInputPriceLongCtx = def.pricing.cachedInputPriceLongCtx ?? null;
        console.info(`Updated pricing for: ${def.provider}/${modelName}`);
      }
    }

    await em.flush();

    const currentNames = MODELS.map((m) => m.name);
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
