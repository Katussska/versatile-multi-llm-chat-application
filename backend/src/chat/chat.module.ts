import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat } from '../entities/Chat';
import { Message } from '../entities/Message';
import { User } from '../entities/User';
import { Model } from '../entities/Model';
import { ChatRepository } from './repositories/chat.repository';
import { MessageRepository } from './repositories/message.repository';

@Module({
  imports: [MikroOrmModule.forFeature([Chat, Message, User, Model])],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository, MessageRepository],
})
export class ChatModule {}
