import { Base } from './Base';
import { Entity, Property } from '@mikro-orm/core';

@Entity()
export class Model extends Base {
  @Property()
  provider!: string;

  @Property()
  name!: string;

  @Property()
  apiEndpoint!: string;
}
