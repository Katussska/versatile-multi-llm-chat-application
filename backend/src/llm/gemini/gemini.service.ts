import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChatSession,
  Content,
  GenerativeModel,
  GoogleGenerativeAI,
} from '@google/generative-ai';
import { GetAIMessageDTO } from './model/get-ai-response.dto';
import { randomUUID } from 'node:crypto';

@Injectable()
export class GeminiService {
  private readonly googleAI: GoogleGenerativeAI;
  private readonly fallbackModel: string;
  // TODO: chatSessions is an in-memory map with no eviction/TTL.
  // With ongoing traffic this can grow without bound and increase
  // memory usage over time. Add TTL/LRU/max-size eviction and cleanup,
  // or move session state to an external cache with expiry.
  private chatSessions: { [sessionId: string]: ChatSession } = {};

  private readonly logger = new Logger(GeminiService.name);
  private readonly geminiApiKey: string;

  constructor(configService: ConfigService) {
    this.geminiApiKey = configService.getOrThrow('GEMINI_API_KEY');
    this.fallbackModel = configService.getOrThrow('GEMINI_MODEL');
    this.googleAI = new GoogleGenerativeAI(this.geminiApiKey);
  }

  private getChatSession(
    modelName?: string,
    sessionId?: string,
    history?: Content[],
    systemInstruction?: string,
  ) {
    const sessionIdToUse = sessionId ?? randomUUID();

    let result = this.chatSessions[sessionIdToUse];

    if (!result) {
      const selectedModel = modelName?.trim() || this.fallbackModel;
      const model: GenerativeModel = this.googleAI.getGenerativeModel({
        model: selectedModel,
        ...(systemInstruction ? { systemInstruction } : {}),
      });
      result = model.startChat({ history });
      this.chatSessions[sessionIdToUse] = result;
    }

    return {
      sessionId: sessionIdToUse,
      chat: result,
    };
  }

  invalidateSession(sessionId: string): void {
    delete this.chatSessions[sessionId];
  }

  async generateText(data: GetAIMessageDTO) {
    try {
      const { sessionId, chat } = this.getChatSession(
        undefined,
        data.sessionId,
      );

      const result = await chat.sendMessage(data.prompt);

      return {
        result: result.response.text(),
        sessionId,
      };
    } catch (error) {
      this.logger.error('Error sending message to Gemini API >> ', error);
      throw new InternalServerErrorException('AI Generation failed');
    }
  }

  async *generateTextStream(
    prompt: string,
    modelName?: string,
    sessionId?: string,
    signal?: AbortSignal,
    history?: Content[],
    systemInstruction?: string,
  ): AsyncGenerator<
    | { type: 'text'; text: string }
    | {
        type: 'usage';
        totalTokens: number;
        promptTokens: number | null;
        completionTokens: number | null;
      }
  > {
    const { chat } = this.getChatSession(modelName, sessionId, history, systemInstruction);
    try {
      const result = await chat.sendMessageStream(prompt, { signal });
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield { type: 'text', text };
        }
      }
      if (!signal?.aborted) {
        const response = await result.response;
        yield {
          type: 'usage',
          totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
          promptTokens: response.usageMetadata?.promptTokenCount ?? null,
          // Gemini calls this candidatesTokenCount; it counts tokens across all response candidates,
          // which for single-candidate requests (default) equals OpenAI-style completion tokens.
          completionTokens:
            response.usageMetadata?.candidatesTokenCount ?? null,
        };
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
