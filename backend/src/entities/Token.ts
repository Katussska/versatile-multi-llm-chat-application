import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { Base } from './Base';
import { User } from './User';
import { Model } from './Model';
import type { Rel } from '@mikro-orm/core';

@Entity()
export class Token extends Base {
  @ManyToOne(() => Model)
  model!: Rel<Model>;

  @ManyToOne(() => User)
  user!: Rel<User>;

  @Property({ type: 'decimal', precision: 10, scale: 6, fieldName: 'dollar_limit', nullable: true })
  dollarLimit: number | null = null;

  @Property({ type: 'decimal', precision: 10, scale: 6, default: 0, fieldName: 'used_dollars' })
  usedDollars: number = 0;

  @Property({ type: 'datetime', fieldName: 'reset_at' })
  resetAt!: Date;
}
