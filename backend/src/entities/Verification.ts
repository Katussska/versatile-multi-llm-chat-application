import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { Base } from './Base';

@Entity({ tableName: 'verification' })
export class Verification extends Base {
  @Property({ type: 'text', index: true })
  identifier!: string;

  @Property({ type: 'text' })
  value!: string;

  @Property({ type: 'datetime', fieldName: 'expires_at' })
  expiresAt!: Date;
}
