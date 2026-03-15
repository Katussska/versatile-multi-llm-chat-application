import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { Base } from './Base';
import { Model } from './Model';
import { User } from './User';

@Entity()
export class Token extends Base {
  @ManyToOne(() => Model)
  model!: Model;

  @ManyToOne(() => User)
  user!: User;

  @Property({ type: 'number', fieldName: 'token_count' })
  tokenCount!: number;

  @Property({ type: 'number', default: 0, fieldName: 'used_tokens' })
  usedTokens: number = 0;

  @Property({ type: 'datetime', fieldName: 'reset_at' })
  resetAt!: Date;
}
