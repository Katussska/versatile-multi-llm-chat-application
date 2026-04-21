import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/postgresql';
import { EntityRepository, raw } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Chat } from '../entities/Chat';
import { Message } from '../entities/Message';
import { User } from '../entities/User';
import { Model } from '../entities/Model';
import { Token } from '../entities/Token';
import { CreateChatDto } from './dto/create-chat.dto';
import { MessageCreateDto } from './dto/message-create.dto';
import { GeminiService } from '../llm/gemini/gemini.service';
import type { Content } from '@google/generative-ai';
import type { Response } from 'express';

function nextMonthFirstDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: EntityRepository<Chat>,
    @InjectRepository(Token)
    private readonly tokenRepository: EntityRepository<Token>,
    private readonly em: EntityManager,
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
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
      favourite: false,
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
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
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

  async patchChat(
    chatId: string,
    userId: string,
    data: { title?: string; favourite?: boolean },
  ): Promise<Chat> {
    const chat = await this.chatRepository.findOne(
      { id: chatId, deletedAt: null },
      { populate: ['user'] },
    );

    if (!chat || chat.user.id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    if (data.title !== undefined) chat.title = data.title;
    if (data.favourite !== undefined) chat.favourite = data.favourite;
    await this.em.flush();
    return chat;
  }

  async patchMessage(
    messageId: string,
    chatId: string,
    userId: string,
    data: { content?: string; favourite?: boolean },
  ): Promise<void> {
    const message = await this.em.findOne(
      Message,
      { id: messageId },
      { populate: ['chat', 'chat.user'] },
    );

    if (!message || message.chat.id !== chatId || message.chat.user.id !== userId) {
      throw new NotFoundException('Message not found');
    }

    if (data.content !== undefined) message.content = data.content;
    if (data.favourite !== undefined) message.favourite = data.favourite;
    await this.em.flush();
  }

  private async updateUsedTokens(userId: string, modelId: string, tokens: number): Promise<void> {
    if (tokens <= 0) return;
    await this.em.nativeUpdate(
      Token,
      { user: userId, model: modelId },
      { usedTokens: raw('used_tokens + ?', [tokens]) },
    );
  }

  async streamResponse(
    chatId: string,
    userId: string,
    content: string,
    res: Response,
    parentMessageId?: string,
    regenerate?: boolean,
  ): Promise<void> {
    const chat = await this.chatRepository.findOne(
      { id: chatId, deletedAt: null },
      { populate: ['user', 'model'] },
    );

    if (!chat || chat.user.id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    const tokenLimit = await this.tokenRepository.findOne({ user: userId, model: chat.model.id });
    if (tokenLimit) {
      if (new Date() >= tokenLimit.resetAt) {
        tokenLimit.usedTokens = 0;
        tokenLimit.resetAt = nextMonthFirstDay();
        await this.em.flush();
      } else if (tokenLimit.usedTokens >= tokenLimit.tokenCount) {
        throw new HttpException(
          { message: 'Token limit exceeded', resetAt: tokenLimit.resetAt },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const existingMessages = await this.em.find(
      Message,
      { chat: { id: chatId } },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    );

    const history: Content[] = existingMessages
      .filter((m) => m.content)
      .map((m) => ({
        role: m.path === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    // Invalidate cached session so it gets rebuilt with fresh DB history
    this.geminiService.invalidateSession(chatId);

    let userMessage: Message | null = null;

    if (!regenerate) {
      userMessage = this.em.create(Message, {
        chat,
        content,
        path: 'user',
        favourite: false,
        parentMessageId: parentMessageId ?? null,
      });
      this.em.persist(userMessage);
    }

    const assistantMessage = this.em.create(Message, {
      chat,
      content: '',
      path: 'model',
      favourite: false,
      parentMessageId: regenerate ? (parentMessageId ?? null) : null,
    });
    this.em.persist(assistantMessage);

    // Send messageId immediately — UUID is generated client-side before flush
    res.write(`data: ${JSON.stringify({ messageId: assistantMessage.id })}\n\n`);

    // Flush DB and start Gemini stream in parallel to reduce latency
    const flushPromise = this.em.flush();

    let fullResponse = '';
    let clientDisconnected = false;
    let tokensUsed = 0;
    const streamAbort = new AbortController();
    res.on('close', () => {
      clientDisconnected = true;
      streamAbort.abort();
    });

    try {
      for await (const item of this.geminiService.generateTextStream(content, chatId, streamAbort.signal, history)) {
        if (item.type === 'usage') {
          tokensUsed = item.totalTokens;
          continue;
        }
        if (clientDisconnected) break;
        fullResponse += item.text;
        res.write(`data: ${JSON.stringify({ chunk: item.text })}\n\n`);
      }

      await flushPromise;

      if (!clientDisconnected) {
        assistantMessage.content = fullResponse;
        await this.updateUsedTokens(userId, chat.model.id, tokensUsed);
        await this.em.flush();
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      } else if (fullResponse) {
        assistantMessage.content = fullResponse;
        await this.updateUsedTokens(userId, chat.model.id, tokensUsed);
        await this.em.flush();
      } else {
        this.em.remove(assistantMessage);
        await this.em.flush();
      }
    } catch {
      await flushPromise.catch(() => {});
      if (!clientDisconnected) {
        res.write(`data: ${JSON.stringify({ error: 'AI Generation failed' })}\n\n`);
      }
      if (fullResponse) {
        assistantMessage.content = fullResponse;
        await this.em.flush();
      } else {
        this.em.remove(assistantMessage);
        await this.em.flush();
      }
    } finally {
      res.end();
    }
  }
}
