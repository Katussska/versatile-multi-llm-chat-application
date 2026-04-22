import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { Base } from './Base';
import { Chat } from './Chat';
import type { Rel } from '@mikro-orm/core';

@Entity()
export class Message extends Base {
  @ManyToOne(() => Chat)
  chat!: Rel<Chat>;

  @Property({ type: 'boolean', default: false })
  favourite: boolean = false;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'text' })
  path!: string;

  @Property({ type: 'text', nullable: true })
  parentMessageId: string | null = null;

  @Property({ type: 'float', default: 0, fieldName: 'cost_usd' })
  costUsd: number = 0;
}
