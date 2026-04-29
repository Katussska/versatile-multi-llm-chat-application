import { OptionalProps, type Rel } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { v7 as uuidv7 } from 'uuid';
import { User } from './User';

@Entity({ tableName: 'usage_log' })
export class UsageLog {
  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv7();

  @ManyToOne(() => User, {
    deleteRule: 'set null',
    fieldName: 'user_id',
    nullable: true,
    index: true,
  })
  user: Rel<User> | null = null;

  @Property({ type: 'text', fieldName: 'model_name' })
  modelName!: string;

  @Property({ type: 'text', fieldName: 'model_key', nullable: true })
  modelKey: string | null = null;

  @Property({ type: 'text', fieldName: 'model_provider', nullable: true })
  modelProvider: string | null = null;

  @Property({ type: 'integer', fieldName: 'prompt_tokens', nullable: true })
  promptTokens: number | null = null;

  @Property({ type: 'integer', fieldName: 'completion_tokens', nullable: true })
  completionTokens: number | null = null;

  @Property({
    type: 'decimal',
    precision: 10,
    scale: 6,
    fieldName: 'cost',
    nullable: true,
  })
  cost: number | null = null;

  @Property({
    type: 'datetime',
    onCreate: () => new Date(),
    fieldName: 'created_at',
  })
  createdAt: Date = new Date();
}
