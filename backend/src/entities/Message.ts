import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { Base } from './Base';
import { Chat } from './Chat';
import type { Rel } from '@mikro-orm/core';

@Entity()
export class Message extends Base {
  @ManyToOne(() => Chat, { deleteRule: 'cascade' })
  chat!: Rel<Chat>;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'text' })
  path!: string;

  @Property({ type: 'uuid', nullable: true })
  parentMessageId: string | null = null;

  @Property({ type: 'text', nullable: true, fieldName: 'model_key' })
  modelKey: string | null = null;

  @Property({ type: 'text', nullable: true, fieldName: 'model_provider' })
  modelProvider: string | null = null;

}
