import { EntityRepository } from '@mikro-orm/core';
import { Message } from '../../entities/Message';

export class MessageRepository extends EntityRepository<Message> {}
