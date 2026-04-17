import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  AuthGuard,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageRequestDto } from './dto/create-message-request.dto';
import { MessageCreateDto } from './dto/message-create.dto';
import { PatchMessageDto } from './dto/patch-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';

@Controller('chats')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiCreatedResponse({
    description: 'Chat successfully created',
    type: ChatResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async createChat(
    @Session() session: UserSession,
    @Body() createChatDto: CreateChatDto,
  ): Promise<ChatResponseDto> {
    const chat = await this.chatService.createChat(
      session.user.id,
      createChatDto,
    );
    return {
      id: chat.id,
      title: chat.title,
      modelId: chat.model.id,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all chats for the authenticated user' })
  @ApiOkResponse({
    description: 'List of user chats sorted by creation date (newest first)',
    type: [ChatResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  async getUserChats(
    @Session() session: UserSession,
  ): Promise<ChatResponseDto[]> {
    const chats = await this.chatService.getUserChats(session.user.id);
    return chats.map((chat) => ({
      id: chat.id,
      title: chat.title,
      modelId: chat.model.id,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get all messages for a specific chat' })
  @ApiOkResponse({
    description: 'List of messages sorted by creation date (oldest first)',
    type: [MessageResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiNotFoundResponse({ description: 'Chat not found or access denied' })
  async getChatMessages(
    @Session() session: UserSession,
    @Param('id') chatId: string,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.chatService.getChatMessages(
      chatId,
      session.user.id,
    );
    return messages.map((msg) => ({
      id: msg.id,
      chatId: msg.chat.id,
      content: msg.content,
      path: msg.path,
      favourite: msg.favourite,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));
  }

  @Post(':id/messages')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Add a message to a chat' })
  @ApiCreatedResponse({
    description: 'Message successfully created',
    type: MessageResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiNotFoundResponse({ description: 'Chat not found or access denied' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async addMessage(
    @Session() session: UserSession,
    @Param('id') chatId: string,
    @Body() requestDto: CreateMessageRequestDto,
  ): Promise<MessageResponseDto> {
    const messageDto: MessageCreateDto = { ...requestDto, chatId };
    const message = await this.chatService.addMessage(
      session.user.id,
      messageDto,
    );
    return {
      id: message.id,
      chatId: message.chat.id,
      content: message.content,
      path: message.path,
      favourite: message.favourite,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chat' })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiNotFoundResponse({ description: 'Chat not found or access denied' })
  async deleteChat(
    @Session() session: UserSession,
    @Param('id') chatId: string,
  ): Promise<void> {
    await this.chatService.deleteChat(chatId, session.user.id);
  }

  @Patch(':chatId/messages/:messageId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update message content' })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiNotFoundResponse({ description: 'Message not found or access denied' })
  async patchMessage(
    @Session() session: UserSession,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @Body() body: PatchMessageDto,
  ): Promise<void> {
    await this.chatService.patchMessageContent(
      messageId,
      chatId,
      session.user.id,
      body.content,
    );
  }

  @Post(':id/stream')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Stream LLM response for a chat message' })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiNotFoundResponse({ description: 'Chat not found or access denied' })
  async streamMessage(
    @Session() session: UserSession,
    @Param('id') chatId: string,
    @Body() body: PatchMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    await this.chatService.streamResponse(chatId, session.user.id, body.content, res);
  }
}
