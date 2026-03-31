import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChatSession,
  GenerativeModel,
  GoogleGenerativeAI,
} from '@google/generative-ai';
import { GetAIMessageDTO } from './model/get-ai-response.dto';
import { v4 } from 'uuid';

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly googleAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;
  private chatSessions: { [sessionId: string]: ChatSession } = {};

  private readonly logger = new Logger(GeminiService.name);
  private readonly geminiApiKey: string;
  private readonly geminiModel: string;

  constructor(configService: ConfigService) {
    this.geminiApiKey = configService.get('GEMINI_API_KEY') || '';
    this.geminiModel = configService.get('GEMINI_MODEL') || '';
    this.googleAI = new GoogleGenerativeAI(this.geminiApiKey);
    this.model = this.googleAI.getGenerativeModel({
      model: this.geminiModel,
    });
  }

  onModuleInit() {
    if (!this.geminiApiKey || this.geminiApiKey.trim() === '') {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    if (!this.geminiModel || this.geminiModel.trim() === '') {
      throw new Error('GEMINI_MODEL is not set in environment variables');
    }
    this.logger.log('Gemini configuration validated');
  }

  private getChatSession(sessionId?: string) {
    let sessionIdToUse = sessionId ?? v4();

    let result = this.chatSessions[sessionIdToUse];

    if (!result) {
      result = this.model.startChat();
      this.chatSessions[sessionIdToUse] = result;
    }

    return {
      sessionId: sessionIdToUse,
      chat: result,
    };
  }

  async generateText(data: GetAIMessageDTO) {
    try {
      const { sessionId, chat } = this.getChatSession(data.sessionId);

      const result = await chat.sendMessage(data.prompt);

      return {
        result: await result.response.text(),
        sessionId,
      };
    } catch (error) {
      this.logger.error('Error sending message to Gemini API >> ', error);
    }
  }
}
