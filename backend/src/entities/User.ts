import { Collection, Entity, OneToMany, Property } from '@mikro-orm/core';
import { Base } from './Base';
import { Chat } from './Chat';
import { Token } from './Token';

@Entity()
export class User extends Base {
  @Property()
  admin!: boolean;

  @OneToMany(() => Chat, (chat) => chat.user)
  chats = new Collection<Chat>(this);

  @OneToMany(() => Token, (token) => token.user)
  tokens = new Collection<Token>(this);
}
