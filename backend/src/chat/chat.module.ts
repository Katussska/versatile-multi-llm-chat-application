import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat } from '../entities/Chat';
import { Message } from '../entities/Message';

@Module({
  imports: [MikroOrmModule.forFeature([Chat, Message])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
