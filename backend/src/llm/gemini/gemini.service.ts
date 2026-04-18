import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChatSession,
  GenerativeModel,
  GoogleGenerativeAI,
} from '@google/generative-ai';
import { GetAIMessageDTO } from './model/get-ai-response.dto';
import { v4 } from 'uuid';

@Injectable()
export class GeminiService {
  private readonly googleAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;
  // TODO: chatSessions is an in-memory map with no eviction/TTL.
  // With ongoing traffic this can grow without bound and increase
  // memory usage over time. Add TTL/LRU/max-size eviction and cleanup,
  // or move session state to an external cache with expiry.
  private chatSessions: { [sessionId: string]: ChatSession } = {};

  private readonly logger = new Logger(GeminiService.name);
  private readonly geminiApiKey: string;
  private readonly geminiModel: string;

  constructor(configService: ConfigService) {
    this.geminiApiKey = configService.getOrThrow('GEMINI_API_KEY');
    this.geminiModel = configService.getOrThrow('GEMINI_MODEL');
    this.googleAI = new GoogleGenerativeAI(this.geminiApiKey);
    this.model = this.googleAI.getGenerativeModel({
      model: this.geminiModel,
    });
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
      throw new InternalServerErrorException('AI Generation failed');
    }
  }

  async *generateTextStream(prompt: string, sessionId?: string, signal?: AbortSignal): AsyncGenerator<string> {
    const { chat } = this.getChatSession(sessionId);
    try {
      const result = await chat.sendMessageStream(prompt, { signal });
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      this.logger.error('Error streaming from Gemini API >> ', error);
      throw new InternalServerErrorException('AI Generation failed');
    }
  }
}
