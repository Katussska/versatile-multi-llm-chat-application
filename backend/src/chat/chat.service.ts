import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

  async createChat(
    userId: string,
    createChatDto: CreateChatDto,
  ): Promise<Chat> {
    const user = await this.em.findOne(User, { id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const model = await this.em.findOne(Model, { id: createChatDto.modelId });
    if (!model) {
      throw new NotFoundException('Model not found');
    }

    const now = new Date();
    const chat = this.chatRepository.create({
      user,
      model,
      title: createChatDto.title,
      createdAt: now,
      updatedAt: now,
    });

    this.em.persist(chat);
    await this.em.flush();
    return chat;
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    const chats = await this.chatRepository.find(
      { user: { id: userId } },
      { orderBy: { createdAt: 'DESC' } },
    );
    return chats;
  }

  async getChatMessages(chatId: string, userId: string): Promise<Message[]> {
    const chat = await this.chatRepository.findOne(
      { id: chatId },
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
      { id: messageDto.chatId },
      { populate: ['user'] },
    );

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.user.id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    const now = new Date();
    const message = this.em.create(Message, {
      chat,
      content: messageDto.content,
      path: messageDto.path,
      favourite: false,
      createdAt: now,
      updatedAt: now,
    });

    this.em.persist(message);
    await this.em.flush();
    return message;
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatRepository.findOne(
      { id: chatId },
      { populate: ['user'] },
    );

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.user.id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    this.em.remove(chat);
    await this.em.flush();
  }
}
