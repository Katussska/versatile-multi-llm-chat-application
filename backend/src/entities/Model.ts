import { Base } from './Base';
import { Entity, OneToOne, Property } from '@mikro-orm/decorators/legacy';
import type { Rel } from '@mikro-orm/core';
import { ModelPricing } from './ModelPricing';

@Entity()
export class Model extends Base {
  @Property({ type: 'string' })
  provider!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  apiEndpoint!: string;

  @Property({ type: 'string' })
  displayLabel!: string;

  @Property({ type: 'string' })
  iconKey!: string;

  @Property({ type: 'boolean', default: true })
  isEnabled: boolean = true;

  @OneToOne(() => ModelPricing, (pricing: Rel<ModelPricing>) => pricing.model, { mappedBy: 'model', nullable: true })
  pricing?: Rel<ModelPricing>;
}
