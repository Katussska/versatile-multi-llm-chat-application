import { Base } from './Base';
import { Entity, OneToOne, Property } from '@mikro-orm/decorators/legacy';
import type { Rel } from '@mikro-orm/core';
import { Model } from './Model';

@Entity({ tableName: 'model_pricing' })
export class ModelPricing extends Base {
  @OneToOne(() => Model, { fieldName: 'model_id', unique: true })
  model!: Rel<Model>;

  @Property({
    type: 'decimal',
    precision: 10,
    scale: 6,
    fieldName: 'input_price',
  })
  inputPrice!: number;

  @Property({
    type: 'decimal',
    precision: 10,
    scale: 6,
    fieldName: 'output_price',
  })
  outputPrice!: number;

  @Property({
    type: 'decimal',
    precision: 10,
    scale: 6,
    fieldName: 'thinking_output_price',
    nullable: true,
  })
  thinkingOutputPrice: number | null = null;

  @Property({
    type: 'decimal',
    precision: 10,
    scale: 6,
    fieldName: 'input_price_long_ctx',
    nullable: true,
  })
  inputPriceLongCtx: number | null = null;

  @Property({
    type: 'decimal',
    precision: 10,
    scale: 6,
    fieldName: 'output_price_long_ctx',
    nullable: true,
  })
  outputPriceLongCtx: number | null = null;
}
