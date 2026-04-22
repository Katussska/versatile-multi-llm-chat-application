import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { Base } from './Base';
import { Model } from './Model';
import { User } from './User';
import type { Rel } from '@mikro-orm/core';

@Entity()
export class Token extends Base {
  @ManyToOne(() => Model)
  model!: Rel<Model>;

  @ManyToOne(() => User)
  user!: Rel<User>;

  @Property({ type: 'number', fieldName: 'token_count', nullable: true })
  tokenCount: number | null = null;

  @Property({ type: 'number', default: 0, fieldName: 'used_tokens' })
  usedTokens: number = 0;

  @Property({ type: 'datetime', fieldName: 'reset_at' })
  resetAt!: Date;
}
