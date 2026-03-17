import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { Base } from './Base';
import { User } from './User';

@Entity({ tableName: 'session' })
export class Session extends Base {
  @ManyToOne(() => User, {
    deleteRule: 'cascade',
    fieldName: 'user_id',
    index: true,
  })
  user!: User;

  @Property({ type: 'text', unique: true })
  token!: string;

  @Property({ type: 'datetime', fieldName: 'expires_at' })
  expiresAt!: Date;

  @Property({ type: 'text', fieldName: 'ip_address', nullable: true })
  ipAddress?: string;

  @Property({ type: 'text', fieldName: 'user_agent', nullable: true })
  userAgent?: string;
}
