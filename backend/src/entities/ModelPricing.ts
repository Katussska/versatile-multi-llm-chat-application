import { Base } from './Base';
import { Entity, OneToOne, Property } from '@mikro-orm/decorators/legacy';
import type { Rel } from '@mikro-orm/core';
import { Model } from './Model';

@Entity({ tableName: 'model_pricing' })
export class ModelPricing extends Base {
  @OneToOne(() => Model, { fieldName: 'model_id', unique: true })
  model!: Rel<Model>;

  @Property({ type: 'decimal', precision: 10, scale: 6, fieldName: 'input_price' })
  inputPrice!: number;

  @Property({ type: 'decimal', precision: 10, scale: 6, fieldName: 'output_price' })
  outputPrice!: number;

  // Anthropic
  @Property({ type: 'decimal', precision: 10, scale: 6, fieldName: 'cache_write_5m_price', nullable: true })
  cacheWrite5mPrice: number | null = null;

  @Property({ type: 'decimal', precision: 10, scale: 6, fieldName: 'cache_write_1h_price', nullable: true })
  cacheWrite1hPrice: number | null = null;

  @Property({ type: 'decimal', precision: 10, scale: 6, fieldName: 'cache_read_price', nullable: true })
  cacheReadPrice: number | null = null;

  // Gemini
  @Property({ type: 'decimal', precision: 10, scale: 6, fieldName: 'context_cache_price', nullable: true })
  contextCachePrice: number | null = null;

  @Property({ type: 'decimal', precision: 10, scale: 6, fieldName: 'thinking_output_price', nullable: true })
  thinkingOutputPrice: number | null = null;

  // OpenAI
  @Property({ type: 'decimal', precision: 10, scale: 6, fieldName: 'cached_input_price', nullable: true })
  cachedInputPrice: number | null = null;

  @Property({ type: 'decimal', precision: 10, scale: 6, fieldName: 'input_price_long_ctx', nullable: true })
  inputPriceLongCtx: number | null = null;

  @Property({ type: 'decimal', precision: 10, scale: 6, fieldName: 'output_price_long_ctx', nullable: true })
  outputPriceLongCtx: number | null = null;

  @Property({ type: 'decimal', precision: 10, scale: 6, fieldName: 'cached_input_price_long_ctx', nullable: true })
  cachedInputPriceLongCtx: number | null = null;
}
