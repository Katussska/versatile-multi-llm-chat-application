import {
  Entity,
  ManyToOne,
  OneToMany,
  Property,
  Collection,
} from '@mikro-orm/core';
import { Base } from './Base';
import { Model } from './Model';
import { User } from './User';
import { Message } from './Message';

@Entity()
export class Chat extends Base {
  @ManyToOne(() => Model)
  model!: Model;

  @ManyToOne(() => User)
  user!: User;

  @OneToMany(() => Message, (message) => message.chat)
  messages = new Collection<Message>(this);

  @Property()
  title!: string;
}
