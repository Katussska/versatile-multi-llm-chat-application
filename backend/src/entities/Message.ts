import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { Base } from './Base';
import { Chat } from './Chat';

@Entity()
export class Message extends Base {
  @ManyToOne(() => Chat)
  chat!: Chat;

  @Property({ default: false })
  favourite: boolean = false;

  @Property()
  content!: string;

  @Property()
  path!: string;
}
