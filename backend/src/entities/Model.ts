import { Base } from './Base';
import { Entity, Property } from '@mikro-orm/decorators/legacy';

@Entity()
export class Model extends Base {
  @Property({ type: 'string' })
  provider!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  apiEndpoint!: string;

  @Property({ type: 'float', default: 0, fieldName: 'price_per_token' })
  pricePerToken: number = 0;
}
