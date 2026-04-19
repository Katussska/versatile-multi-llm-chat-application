import { Collection, type Rel } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/decorators/legacy';
import { Base } from './Base';
import { Model } from './Model';
import { User } from './User';
import { Message } from './Message';

@Entity()
export class Chat extends Base {
  @ManyToOne(() => Model)
  model!: Model;

  @ManyToOne(() => User)
  user!: Rel<User>;

  @OneToMany(() => Message, (message) => message.chat)
  messages = new Collection<Message>(this);

  @Property({ type: 'string' })
  title!: string;

  @Property({ type: 'boolean', default: false })
  favourite: boolean = false;
}
