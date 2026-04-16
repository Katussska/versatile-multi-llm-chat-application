import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/postgresql';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Chat } from '../entities/Chat';
import { Message } from '../entities/Message';
import { User } from '../entities/User';
import { Model } from '../entities/Model';
import { CreateChatDto } from './dto/create-chat.dto';
import { MessageCreateDto } from './dto/message-create.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: EntityRepository<Chat>,
    private readonly em: EntityManager,
    private readonly configService: ConfigService,
  ) {}

  private async getOrCreateDefaultModel(): Promise<Model> {
    const existingModel = await this.em.findOne(
      Model,
      { deletedAt: null },
      { orderBy: { createdAt: 'ASC' } },
    );

    if (existingModel) {
      return existingModel;
    }

    const geminiModelName =
      this.configService.get<string>('GEMINI_MODEL')?.trim() ||
      'gemini-2.5-flash';
    const defaultModel = this.em.create(Model, {
      provider: 'gemini',
      name: geminiModelName,
      apiEndpoint: `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelName}`,
    });

    this.em.persist(defaultModel);
    await this.em.flush();

    return defaultModel;
  }

  async createChat(
    userId: string,
    createChatDto: CreateChatDto,
  ): Promise<Chat> {
    const user = await this.em.findOne(User, { id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const model = createChatDto.modelId
      ? await this.em.findOne(Model, {
          id: createChatDto.modelId,
          deletedAt: null,
        })
      : await this.getOrCreateDefaultModel();

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    const chat = this.chatRepository.create({
      user,
      model,
      title: createChatDto.title,
    });

    this.em.persist(chat);
    await this.em.flush();
    return chat;
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    const chats = await this.chatRepository.find(
      { user: { id: userId }, deletedAt: null },
      { orderBy: { createdAt: 'DESC' } },
    );
    return chats;
  }

  async getChatMessages(chatId: string, userId: string): Promise<Message[]> {
    const chat = await this.chatRepository.findOne(
      { id: chatId, deletedAt: null },
      { populate: ['user'] },
    );

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.user.id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    const messages = await this.em.find(
      Message,
      { chat: { id: chatId } },
      { orderBy: { createdAt: 'ASC' } },
    );

    return messages;
  }

  async addMessage(
    userId: string,
    messageDto: MessageCreateDto,
  ): Promise<Message> {
    const chat = await this.chatRepository.findOne(
      { id: messageDto.chatId, deletedAt: null },
      { populate: ['user'] },
    );

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.user.id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    const message = this.em.create(Message, {
      chat,
      content: messageDto.content,
      path: messageDto.path,
      favourite: false,
    });

    this.em.persist(message);
    await this.em.flush();
    return message;
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatRepository.findOne(
      { id: chatId, deletedAt: null },
      { populate: ['user'] },
    );

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.user.id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    chat.deletedAt = new Date();
    await this.em.flush();
  }
}
