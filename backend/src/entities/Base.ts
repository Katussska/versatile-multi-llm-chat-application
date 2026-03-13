import { PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { uuidv7 } from 'uuidv7';

export abstract class Base {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv7();

  @Property({ type: 'datetime', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
