import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { Base } from './Base';
import { User } from './User';

@Entity({ tableName: 'account' })
export class Account extends Base {
  @Property({ type: 'text', fieldName: 'account_id' })
  accountId!: string;

  @Property({ type: 'text', fieldName: 'provider_id' })
  providerId!: string;

  @ManyToOne(() => User, {
    deleteRule: 'cascade',
    fieldName: 'user_id',
    index: true,
  })
  user!: User;

  @Property({ type: 'text', fieldName: 'access_token', nullable: true })
  accessToken?: string;

  @Property({ type: 'text', fieldName: 'refresh_token', nullable: true })
  refreshToken?: string;

  @Property({ type: 'text', fieldName: 'id_token', nullable: true })
  idToken?: string;

  @Property({
    type: 'datetime',
    fieldName: 'access_token_expires_at',
    nullable: true,
  })
  accessTokenExpiresAt?: Date;

  @Property({
    type: 'datetime',
    fieldName: 'refresh_token_expires_at',
    nullable: true,
  })
  refreshTokenExpiresAt?: Date;

  @Property({ type: 'text', nullable: true })
  scope?: string;

  @Property({ type: 'text', nullable: true })
  password?: string;
}
