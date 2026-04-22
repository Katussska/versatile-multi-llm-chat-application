import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat } from '../entities/Chat';
import { Message } from '../entities/Message';
import { User } from '../entities/User';
import { Model } from '../entities/Model';
import { Token } from '../entities/Token';
import { GeminiModule } from '../llm/gemini/gemini.module';
import { LimitGuard } from '../llm/limit.guard';

@Module({
  imports: [
    MikroOrmModule.forFeature([Chat, Message, User, Model, Token]),
    GeminiModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, LimitGuard],
})
export class ChatModule {}
