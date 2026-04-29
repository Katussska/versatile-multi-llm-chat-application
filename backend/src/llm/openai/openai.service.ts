import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { APIError } from 'openai';

export type OpenAIMessage = { role: 'user' | 'assistant'; content: string };

@Injectable()
export class OpenAIService {
  private readonly client: OpenAI | null = null;
  private readonly fallbackModel = 'gpt-5.4-mini';
  private readonly logger = new Logger(OpenAIService.name);

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('OPENAI_API_KEY');

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    } else {
      this.logger.warn(
        'OPENAI_API_KEY není nastaveno — OpenAI modely nebudou dostupné',
      );
    }
  }

  async *generateTextStream(
    prompt: string,
    history: OpenAIMessage[],
    modelName?: string,
    signal?: AbortSignal,
    systemPrompt?: string,
  ): AsyncGenerator<
    | { type: 'text'; text: string }
    | { type: 'error'; error: string }
    | {
        type: 'usage';
        totalTokens: number;
        promptTokens: number | null;
        completionTokens: number | null;
      }
  > {
    if (!this.client) {
      yield { type: 'error', error: 'OpenAI API key is not configured' };
      return;
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...(systemPrompt
        ? [{ role: 'system' as const, content: systemPrompt }]
        : []),
      ...history,
      { role: 'user', content: prompt },
    ];

    let promptTokens: number | null = null;
    let completionTokens: number | null = null;

    try {
      const selectedModel = modelName?.trim() || this.fallbackModel;
      this.logger.log(`Odesílám požadavek na OpenAI model: ${selectedModel}`);

      const stream = await this.client.chat.completions.create(
        {
          model: selectedModel,
          messages,
          stream: true,
          stream_options: { include_usage: true },
        },
        { signal },
      );

      let firstChunk = true;
      for await (const chunk of stream) {
        if (firstChunk) {
          this.logger.log(
            `První chunk přijat od modelu: ${chunk.model ?? selectedModel}`,
          );
          firstChunk = false;
        }

        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield { type: 'text', text: delta };
        }

        if (chunk.usage) {
          promptTokens = chunk.usage.prompt_tokens ?? null;
          completionTokens = chunk.usage.completion_tokens ?? null;
        }
      }

      if (!signal?.aborted) {
        this.logger.log(
          `Stream dokončen — model: ${selectedModel}, prompt: ${promptTokens ?? 0} tokenů, completion: ${completionTokens ?? 0} tokenů`,
        );
        yield {
          type: 'usage',
          totalTokens: (promptTokens ?? 0) + (completionTokens ?? 0),
          promptTokens,
          completionTokens,
        };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      const errorMessage = this.getErrorMessage(error);
      if (error instanceof APIError) {
        this.logger.error(`OpenAI API chyba ${error.status}: ${error.message}`);
      } else {
        this.logger.error('Chyba při streamování z OpenAI API >> ', error);
      }
      yield { type: 'error', error: errorMessage };
    }
  }

  private getErrorMessage(error: unknown): string {
    const err = error as any;

    if (err instanceof APIError) {
      if (err.status === 429) {
        return 'OpenAI API rate limit exceeded. Please wait a moment before trying again.';
      }
      if (err.status === 503) {
        return 'OpenAI API is temporarily unavailable. Please try again later.';
      }
      if (err.status === 401 || err.status === 403) {
        return 'OpenAI API authentication failed. Please check your API key configuration.';
      }
      if (err.status === 404) {
        return 'The specified OpenAI model was not found.';
      }
      if (err.status && err.status >= 500) {
        return `OpenAI server error (${err.status}). Please try again later.`;
      }
      if (err.message?.includes('quota')) {
        return 'OpenAI API quota exceeded. Please check your account limits.';
      }
      return `OpenAI API error: ${err.message || 'Request failed'}`;
    }

    return 'Failed to generate response. Please try again.';
  }
}
