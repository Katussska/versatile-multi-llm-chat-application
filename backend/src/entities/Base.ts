import { PrimaryKey, Property } from '@mikro-orm/core';
import { uuidv7 } from 'uuidv7';

export abstract class Base {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv7();

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
