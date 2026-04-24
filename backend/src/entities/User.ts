import { Collection } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  OneToMany,
  Property,
} from '@mikro-orm/decorators/legacy';
import { Base } from './Base';
import { Account } from './Account';
import { Chat } from './Chat';
import { Session } from './Session';
import { Token } from './Token';
import { UsageLog } from './UsageLog';
import { UserRole } from './UserRole';

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

  @Enum({ items: () => UserRole, nativeEnumName: 'user_role' })
  role: UserRole = UserRole.USER;

  @Property({ type: 'integer', fieldName: 'monthly_token_limit', nullable: true })
  monthlyTokenLimit: number | null = null;

  @OneToMany(() => Chat, (chat) => chat.user)
  chats = new Collection<Chat>(this);

  @OneToMany(() => Session, (session) => session.user)
  sessions = new Collection<Session>(this);

  @OneToMany(() => Account, (account) => account.user)
  accounts = new Collection<Account>(this);

  @OneToMany(() => Token, (token) => token.user)
  tokens = new Collection<Token>(this);

  @OneToMany(() => UsageLog, (usageLog) => usageLog.user)
  usageLogs = new Collection<UsageLog>(this);
}
