import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Base } from './Base';
import { Model } from './Model';
import { User } from './User';

@Entity()
export class Token extends Base {
  @ManyToOne(() => Model)
  model!: Model;

  @ManyToOne(() => User)
  user!: User;

  @Property()
  token_count!: number;

  @Property({ default: 0 })
  used_tokens: number = 0;

  @Property()
  reset_at!: Date;
}
