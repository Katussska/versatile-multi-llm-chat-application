import { OptionalProps, type Rel } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { uuidv7 } from 'uuidv7';
import { User } from './User';

@Entity({ tableName: 'usage_log' })
export class UsageLog {
  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv7();

  @ManyToOne(() => User, {
    deleteRule: 'cascade',
    fieldName: 'user_id',
    index: true,
  })
  user!: Rel<User>;

  @Property({ type: 'text', fieldName: 'model_name' })
  modelName!: string;

  @Property({ type: 'text', fieldName: 'model_provider', nullable: true })
  modelProvider: string | null = null;

  @Property({ type: 'integer', fieldName: 'prompt_tokens', nullable: true })
  promptTokens: number | null = null;

  @Property({ type: 'integer', fieldName: 'completion_tokens', nullable: true })
  completionTokens: number | null = null;

  @Property({
    type: 'datetime',
    onCreate: () => new Date(),
    fieldName: 'created_at',
  })
  createdAt: Date = new Date();
}
