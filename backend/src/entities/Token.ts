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

  @Property({ type: 'number' })
  token_count!: number;

  @Property({ type: 'number', default: 0 })
  used_tokens: number = 0;

  @Property({ type: 'datetime' })
  reset_at!: Date;
}
