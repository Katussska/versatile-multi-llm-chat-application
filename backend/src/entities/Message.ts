import {
  Entity,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/decorators/legacy';
import { Base } from './Base';
import { Chat } from './Chat';

@Entity()
export class Message extends Base {
  @ManyToOne(() => Chat)
  chat!: Chat;

  @Property({ type: 'boolean', default: false })
  favourite: boolean = false;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'text' })
  path!: string;
}
