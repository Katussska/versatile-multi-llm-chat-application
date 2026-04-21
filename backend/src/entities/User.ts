import { Collection } from '@mikro-orm/core';
import { Entity, OneToMany, Property } from '@mikro-orm/decorators/legacy';
import { Base } from './Base';
import { Account } from './Account';
import { Chat } from './Chat';
import { Session } from './Session';
import { Token } from './Token';

@Entity({ tableName: 'user' })
export class User extends Base {
  @Property({ type: 'text' })
  name!: string;

  @Property({ type: 'text', unique: true })
  email!: string;

  @Property({ type: 'boolean', default: false, fieldName: 'email_verified' })
  emailVerified: boolean = false;

  @Property({ type: 'text', nullable: true })
  image?: string;

  @Property({ type: 'boolean', default: false })
  admin: boolean = false;

  @Property({ type: 'integer', nullable: true, fieldName: 'monthly_limit' })
  monthlyLimit: number | null = null;

  @OneToMany(() => Chat, (chat) => chat.user)
  chats = new Collection<Chat>(this);

  @OneToMany(() => Session, (session) => session.user)
  sessions = new Collection<Session>(this);

  @OneToMany(() => Account, (account) => account.user)
  accounts = new Collection<Account>(this);

  @OneToMany(() => Token, (token) => token.user)
  tokens = new Collection<Token>(this);
}
