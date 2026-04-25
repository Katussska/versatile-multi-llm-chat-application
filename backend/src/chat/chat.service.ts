import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/postgresql';
import { EntityRepository, raw } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Chat } from '../entities/Chat';
import { Message } from '../entities/Message';
import { User } from '../entities/User';
import { Model } from '../entities/Model';
import { Token } from '../entities/Token';
import { UsageLog } from '../entities/UsageLog';
import { CreateChatDto } from './dto/create-chat.dto';
import { MessageCreateDto } from './dto/message-create.dto';
import { GeminiService } from '../llm/gemini/gemini.service';
import { AnthropicService } from '../llm/anthropic/anthropic.service';
import type { Content } from '@google/generative-ai';
import type { Response } from 'express';
import { nextMonthFirstDay } from '../date.utils';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: EntityRepository<Chat>,
    @InjectRepository(Token)
    private readonly tokenRepository: EntityRepository<Token>,
    private readonly em: EntityManager,
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
    private readonly anthropicService: AnthropicService,
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
      displayLabel: 'Gemini 2.5 Flash',
      iconKey: 'gemini',
      isEnabled: true,
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
      { chat: { id: chatId }, deletedAt: null },
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
      { populate: ['user', 'model'] },
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
      modelKey: chat.model.name,
      modelProvider: chat.model.provider,
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
    data: { title?: string; favourite?: boolean; modelId?: string },
  ): Promise<Chat> {
    const chat = await this.chatRepository.findOne(
      { id: chatId, deletedAt: null },
      { populate: ['user', 'model'] },
    );

    if (!chat || chat.user.id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    if (data.title !== undefined) chat.title = data.title;
    if (data.favourite !== undefined) chat.favourite = data.favourite;
    if (data.modelId !== undefined) {
      const model = await this.em.findOne(Model, {
        id: data.modelId,
        deletedAt: null,
      });
      if (!model) throw new NotFoundException('Model not found');
      chat.model = model;
    }
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

    if (
      !message ||
      message.chat.id !== chatId ||
      message.chat.user.id !== userId
    ) {
      throw new NotFoundException('Message not found');
    }

    if (data.content !== undefined) message.content = data.content;
    if (data.favourite !== undefined) message.favourite = data.favourite;
    await this.em.flush();
  }

  private async softDeleteTimelineFromMessage(
    chatId: string,
    boundaryMessageId: string,
    inclusive: boolean,
  ): Promise<void> {
    const timeline = await this.em.find(
      Message,
      { chat: { id: chatId }, deletedAt: null },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    );

    const boundaryIndex = timeline.findIndex(
      (msg) => msg.id === boundaryMessageId,
    );
    if (boundaryIndex === -1) {
      this.logger.warn(
        `[DEBUG] Timeline truncate skipped: boundary message ${boundaryMessageId} not found in chat ${chatId}`,
      );
      return;
    }

    const deleteFromIndex = inclusive ? boundaryIndex : boundaryIndex + 1;
    const toDelete = timeline.slice(deleteFromIndex);
    if (toDelete.length === 0) {
      this.logger.log(
        `[DEBUG] Timeline truncate no-op for chat ${chatId}. boundaryIndex=${boundaryIndex} inclusive=${inclusive}`,
      );
      return;
    }

    this.logger.log(
      `[DEBUG] Timeline truncate in chat ${chatId}: deleting ${toDelete.length} messages from index ${deleteFromIndex} (boundaryIndex=${boundaryIndex}, inclusive=${inclusive})`,
    );

    const now = new Date();
    for (const msg of toDelete) {
      msg.deletedAt = now;
    }
  }

  private async softDeleteAllChatMessages(chatId: string): Promise<void> {
    const messages = await this.em.find(Message, {
      chat: { id: chatId },
      deletedAt: null,
    });
    if (messages.length === 0) return;

    const now = new Date();
    for (const msg of messages) {
      msg.deletedAt = now;
    }
  }

  private async softDeleteFromMessageInclusive(
    chatId: string,
    rootMessageId: string,
  ): Promise<void> {
    const conn = this.em.getConnection();
    const rows = await conn.execute<{ id: string }[]>(
      `WITH RECURSIVE subtree AS (
         SELECT id FROM message
         WHERE id = CAST(? AS uuid)
           AND chat_id = CAST(? AS uuid)
           AND deleted_at IS NULL
         UNION ALL
         SELECT m.id
         FROM message m
         JOIN subtree s ON m.parent_message_id = s.id
         WHERE m.deleted_at IS NULL
       )
       SELECT id FROM subtree`,
      [rootMessageId, chatId],
    );

    if (rows.length === 0) return;

    const ids = rows.map((r) => r.id);
    const messages = await this.em.find(Message, { id: { $in: ids } });
    const now = new Date();
    for (const msg of messages) {
      msg.deletedAt = now;
    }
  }

  private async loadBranch(
    chatId: string,
    tipMessageId: string | null,
  ): Promise<Message[]> {
    if (!tipMessageId) {
      return [];
    }

    const conn = this.em.getConnection();
    const rows = await conn.execute<{ id: string }[]>(
      `WITH RECURSIVE branch AS (
         SELECT id, parent_message_id FROM message WHERE id = CAST(? AS uuid) AND deleted_at IS NULL
         UNION ALL
         SELECT m.id, m.parent_message_id FROM message m JOIN branch b ON m.id = b.parent_message_id WHERE m.deleted_at IS NULL
       )
       SELECT id FROM branch`,
      [tipMessageId],
    );

    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return [];

    return this.em.find(
      Message,
      { id: { $in: ids } },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    );
  }

  private async updateUsedTokens(
    userId: string,
    modelId: string,
    tokens: number,
  ): Promise<void> {
    if (tokens <= 0) return;

    const tokenLimit = await this.tokenRepository.findOne({
      user: userId,
      model: modelId,
    });
    if (tokenLimit) {
      await this.em.nativeUpdate(
        Token,
        { user: userId, model: modelId },
        { usedTokens: raw('used_tokens + ?', [tokens]) },
      );
      return;
    }

    const usageCounter = this.em.create(Token, {
      user: this.em.getReference(User, userId),
      model: this.em.getReference(Model, modelId),
      tokenCount: null,
      usedTokens: tokens,
      resetAt: nextMonthFirstDay(),
    });
    this.em.persist(usageCounter);
  }

  private createUsageLog(
    userId: string,
    modelKey: string,
    modelName: string,
    modelProvider: string,
    promptTokens: number | null,
    completionTokens: number | null,
  ): void {
    const usageLog = this.em.create(UsageLog, {
      user: this.em.getReference(User, userId),
      modelKey,
      modelName,
      modelProvider,
      promptTokens,
      completionTokens,
    });
    this.em.persist(usageLog);
  }

  private async finalizeStream(
    assistantMessage: Message,
    userMessage: Message | null,
    fullResponse: string,
    userId: string,
    model: Model,
    usage: {
      totalTokens: number;
      promptTokens: number | null;
      completionTokens: number | null;
    },
    opts: {
      saveEvenIfEmpty?: boolean;
      removeUserOnEmpty?: boolean;
      sendDone?: boolean;
      res?: Response;
    } = {},
  ): Promise<void> {
    const {
      saveEvenIfEmpty = false,
      removeUserOnEmpty = false,
      sendDone = false,
      res,
    } = opts;

    if (fullResponse || saveEvenIfEmpty) {
      assistantMessage.content = fullResponse;
      await this.updateUsedTokens(userId, model.id, usage.totalTokens);
    } else {
      this.em.remove(assistantMessage);
      if (removeUserOnEmpty && userMessage) this.em.remove(userMessage);
    }
    this.createUsageLog(
      userId,
      model.name,
      model.name,
      model.provider,
      usage.promptTokens,
      usage.completionTokens,
    );
    await this.em.flush();
    if (sendDone && res) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }
  }

  private buildSystemPrompt(modelName: string): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    return [
      'You are an AI assistant in Cognify, a multi-model chat application.',
      `Current date and time: ${date} ${time} UTC`,
      `Active model: ${modelName}`,
      'Always respond in the same language the user writes in.',
      'Format your responses using Markdown where it improves readability.',
    ].join('\n');
  }

  private buildLlmStream(
    provider: string,
    modelName: string,
    prompt: string,
    chatId: string,
    historyMessages: Message[],
    signal: AbortSignal,
  ): AsyncGenerator<
    | { type: 'text'; text: string }
    | {
        type: 'usage';
        totalTokens: number;
        promptTokens: number | null;
        completionTokens: number | null;
      }
  > {
    if (provider === 'anthropic') {
      const history = historyMessages
        .filter((m) => m.content)
        .map((m) => ({
          role: m.path === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.content,
        }));

      while (history.length > 0 && history[0].role === 'assistant') {
        history.shift();
      }
      while (
        history.length > 0 &&
        history[history.length - 1].role === 'user'
      ) {
        history.pop();
      }

      return this.anthropicService.generateTextStream(
        prompt,
        history,
        modelName,
        signal,
        this.buildSystemPrompt(modelName),
      );
    }

    const history: Content[] = historyMessages
      .filter((m) => m.content)
      .map((m) => ({
        role: m.path === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }
    while (history.length > 0 && history[history.length - 1].role === 'user') {
      history.pop();
    }

    this.geminiService.invalidateSession(chatId);
    return this.geminiService.generateTextStream(
      prompt,
      modelName,
      chatId,
      signal,
      history,
      this.buildSystemPrompt(modelName),
    );
  }

  async streamResponse(
    chatId: string,
    userId: string,
    content: string,
    res: Response,
    parentMessageId?: string,
    regenerate?: boolean,
    truncateFromMessageId?: string,
  ): Promise<void> {
    const chat = await this.chatRepository.findOne(
      { id: chatId, deletedAt: null },
      { populate: ['user', 'model'] },
    );

    if (!chat || chat.user.id !== userId) {
      throw new NotFoundException('Chat not found');
    }

    const tokenLimit = await this.tokenRepository.findOne({
      user: userId,
      model: chat.model.id,
    });
    if (tokenLimit) {
      if (new Date() >= tokenLimit.resetAt) {
        tokenLimit.usedTokens = 0;
        tokenLimit.resetAt = nextMonthFirstDay();
        await this.em.flush();
      } else if (
        tokenLimit.tokenCount !== null &&
        tokenLimit.usedTokens >= tokenLimit.tokenCount
      ) {
        throw new HttpException(
          { message: 'Token limit exceeded', resetAt: tokenLimit.resetAt },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    let historyMessages: Message[];
    if (regenerate && parentMessageId) {
      const userMsg = await this.em.findOne(Message, { id: parentMessageId });
      historyMessages = await this.loadBranch(
        chatId,
        userMsg?.parentMessageId ?? null,
      );
    } else {
      historyMessages = await this.loadBranch(chatId, parentMessageId ?? null);
    }

    const provider = chat.model.provider;

    if (truncateFromMessageId) {
      await this.softDeleteTimelineFromMessage(
        chatId,
        truncateFromMessageId,
        true,
      );
    } else if (parentMessageId) {
      await this.softDeleteTimelineFromMessage(chatId, parentMessageId, false);
    } else {
      await this.softDeleteAllChatMessages(chatId);
    }

    let userMessage: Message | null = null;

    if (!regenerate) {
      userMessage = this.em.create(Message, {
        chat,
        content,
        path: 'user',
        favourite: false,
        parentMessageId: parentMessageId ?? null,
        modelKey: chat.model.name,
        modelProvider: chat.model.provider,
      });
      this.em.persist(userMessage);
    }

    const assistantMessage = this.em.create(Message, {
      chat,
      content: '',
      path: 'model',
      favourite: false,
      parentMessageId: regenerate
        ? (parentMessageId ?? null)
        : (userMessage?.id ?? null),
      modelKey: chat.model.name,
      modelProvider: chat.model.provider,
    });
    this.em.persist(assistantMessage);

    // Send messageId immediately — UUID is generated client-side before flush
    res.write(
      `data: ${JSON.stringify({ messageId: assistantMessage.id })}\n\n`,
    );

    // Flush DB and start Gemini stream in parallel to reduce latency
    const flushPromise = this.em.flush();

    let fullResponse = '';
    let clientDisconnected = false;
    let usage = {
      totalTokens: 0,
      promptTokens: null as number | null,
      completionTokens: null as number | null,
    };
    const streamAbort = new AbortController();
    res.on('close', () => {
      clientDisconnected = true;
      streamAbort.abort();
    });

    this.logger.log(
      `[stream] chatId=${chatId} userId=${userId} provider=${provider} model=${chat.model.name} regenerate=${regenerate} parentMessageId=${parentMessageId}`,
    );

    const streamStart = Date.now();
    const llmStream = this.buildLlmStream(
      provider,
      chat.model.name,
      content,
      chatId,
      historyMessages,
      streamAbort.signal,
    );

    try {
      for await (const item of llmStream) {
        if (item.type === 'usage') {
          usage = {
            totalTokens: item.totalTokens,
            promptTokens: item.promptTokens,
            completionTokens: item.completionTokens,
          };
          continue;
        }
        if (clientDisconnected) break;
        fullResponse += item.text;
        res.write(`data: ${JSON.stringify({ chunk: item.text })}\n\n`);
      }

      this.logger.log(
        `[stream] status=ok provider=${provider} model=${chat.model.name} latencyMs=${Date.now() - streamStart} tokensUsed=${usage.totalTokens} clientDisconnected=${clientDisconnected}`,
      );
      await flushPromise;

      await this.finalizeStream(
        assistantMessage,
        userMessage,
        fullResponse,
        userId,
        chat.model,
        usage,
        {
          saveEvenIfEmpty: !clientDisconnected,
          sendDone: !clientDisconnected,
          res,
        },
      );
    } catch (err) {
      this.logger.error(
        `[stream] status=error provider=${provider} model=${chat.model.name} latencyMs=${Date.now() - streamStart} error=${(err as Error)?.message}`,
        (err as Error)?.stack,
      );
      await flushPromise.catch((flushErr: unknown) => {
        this.logger.error(
          `[stream] flushPromise also failed: ${(flushErr as Error)?.message}`,
        );
      });
      if (!clientDisconnected) {
        res.write(
          `data: ${JSON.stringify({ error: 'AI Generation failed' })}\n\n`,
        );
      }
      await this.finalizeStream(
        assistantMessage,
        userMessage,
        fullResponse,
        userId,
        chat.model,
        usage,
        { removeUserOnEmpty: true },
      );
    } finally {
      res.end();
    }
  }
}
