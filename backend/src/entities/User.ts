import { Collection } from '@mikro-orm/core';
import { Entity, OneToMany, Property } from '@mikro-orm/decorators/legacy';
import { Base } from './Base';
import { Chat } from './Chat';
import { Token } from './Token';

@Entity()
export class User extends Base {
  @Property({ type: 'boolean' })
  admin!: boolean;

  @OneToMany(() => Chat, (chat) => chat.user)
  chats = new Collection<Chat>(this);

  @OneToMany(() => Token, (token) => token.user)
  tokens = new Collection<Token>(this);
}
