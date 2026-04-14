import { EntityRepository } from '@mikro-orm/core';
import { Chat } from '../../entities/Chat';

export class ChatRepository extends EntityRepository<Chat> {}
