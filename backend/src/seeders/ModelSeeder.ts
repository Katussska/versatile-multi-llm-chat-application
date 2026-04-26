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
  contextCachePriceLongCtx?: number;
  contextCacheStoragePrice?: number;
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
      inputPrice: 0.10,
      outputPrice: 0.40,
      contextCachePrice: 0.01,
      contextCacheStoragePrice: 1.00,
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
      inputPrice: 0.30,
      outputPrice: 2.50,
      contextCachePrice: 0.03,
      contextCacheStoragePrice: 1.00,
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
      outputPrice: 10.00,
      contextCachePrice: 0.125,
      contextCachePriceLongCtx: 0.25,
      contextCacheStoragePrice: 4.50,
      inputPriceLongCtx: 2.50,
      outputPriceLongCtx: 15.00,
    },
  },
  {
    provider: 'anthropic',
    name: 'claude-haiku-4-5-20251001',
    displayLabel: 'Claude Haiku 4.5',
    iconKey: 'anthropic',
    apiEndpoint: () => 'https://api.anthropic.com/v1/messages',
    pricing: {
      inputPrice: 1,
      outputPrice: 5,
      cacheWrite5mPrice: 1.25,
      cacheWrite1hPrice: 2,
      cacheReadPrice: 0.10,
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
      cacheWrite1hPrice: 6,
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
      inputPrice: 5,
      outputPrice: 25,
      cacheWrite5mPrice: 6.25,
      cacheWrite1hPrice: 10,
      cacheReadPrice: 0.50,
    },
  },
  {
    provider: 'openai',
    name: 'gpt-5.4-nano',
    displayLabel: 'ChatGPT 5.4 Nano',
    iconKey: 'openai',
    apiEndpoint: () => 'https://api.openai.com/v1/chat/completions',
    pricing: {
      inputPrice: 0.20,
      outputPrice: 1.25,
      cachedInputPrice: 0.02,
    },
  },
  {
    provider: 'openai',
    name: 'gpt-5.4-mini',
    displayLabel: 'ChatGPT 5.4 Mini',
    iconKey: 'openai',
    apiEndpoint: () => 'https://api.openai.com/v1/chat/completions',
    pricing: {
      inputPrice: 0.75,
      outputPrice: 4.50,
      cachedInputPrice: 0.075,
    },
  },
  {
    provider: 'openai',
    name: 'gpt-5.5',
    displayLabel: 'ChatGPT 5.5',
    iconKey: 'openai',
    apiEndpoint: () => 'https://api.openai.com/v1/chat/completions',
    pricing: {
      inputPrice: 5,
      outputPrice: 30,
      cachedInputPrice: 0.50,
      inputPriceLongCtx: 10,
      outputPriceLongCtx: 45,
      cachedInputPriceLongCtx: 1,
    },
  },
  {
    provider: 'openai',
    name: 'gpt-5.4',
    displayLabel: 'ChatGPT 5.4',
    iconKey: 'openai',
    apiEndpoint: () => 'https://api.openai.com/v1/chat/completions',
    pricing: {
      inputPrice: 2.50,
      outputPrice: 15,
      cachedInputPrice: 0.25,
      inputPriceLongCtx: 5,
      outputPriceLongCtx: 22.50,
      cachedInputPriceLongCtx: 0.50,
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
          contextCachePriceLongCtx: def.pricing.contextCachePriceLongCtx ?? null,
          contextCacheStoragePrice: def.pricing.contextCacheStoragePrice ?? null,
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
        existingPricing.contextCachePriceLongCtx = def.pricing.contextCachePriceLongCtx ?? null;
        existingPricing.contextCacheStoragePrice = def.pricing.contextCacheStoragePrice ?? null;
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
