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

  @Property({ type: 'string' })
  displayLabel!: string;

  @Property({ type: 'string' })
  iconKey!: string;

  @Property({ type: 'boolean', default: true })
  isEnabled: boolean = true;
}
