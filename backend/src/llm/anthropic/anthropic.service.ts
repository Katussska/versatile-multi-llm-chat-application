import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic, { APIError } from '@anthropic-ai/sdk';

export type AnthropicMessage = { role: 'user' | 'assistant'; content: string };

@Injectable()
export class AnthropicService {
  private readonly client: Anthropic | null = null;
  private readonly fallbackModel = 'claude-haiku-4-5-20251001';
  private readonly logger = new Logger(AnthropicService.name);

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('ANTHROPIC_API_KEY');

    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    } else {
      this.logger.warn(
        'ANTHROPIC_API_KEY není nastaveno — Claude modely nebudou dostupné',
      );
    }
  }

  async *generateTextStream(
    prompt: string,
    history: AnthropicMessage[],
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
      yield { type: 'error', error: 'Anthropic API key is not configured' };
      return;
    }

    const messages: Anthropic.MessageParam[] = [
      ...history.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: prompt },
    ];

    let inputTokens: number | null = null;
    let outputTokens: number | null = null;

    try {
      const selectedModel = modelName?.trim() || this.fallbackModel;

      const stream = await this.client.messages.create(
        {
          model: selectedModel,
          max_tokens: 4096,
          messages,
          stream: true,
          ...(systemPrompt
            ? {
                system: [
                  {
                    type: 'text' as const,
                    text: systemPrompt,
                    cache_control: { type: 'ephemeral' as const },
                  },
                ],
              }
            : {}),
        },
        { signal },
      );

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield { type: 'text', text: event.delta.text };
        } else if (event.type === 'message_start') {
          inputTokens = event.message.usage.input_tokens;
        } else if (event.type === 'message_delta') {
          outputTokens = event.usage.output_tokens;
        }
      }

      if (!signal?.aborted) {
        yield {
          type: 'usage',
          totalTokens: (inputTokens ?? 0) + (outputTokens ?? 0),
          promptTokens: inputTokens,
          completionTokens: outputTokens,
        };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      const errorMessage = this.getErrorMessage(error);
      if (error instanceof APIError) {
        this.logger.error(
          `Anthropic API chyba ${error.status}: ${error.message}`,
        );
      } else {
        this.logger.error('Chyba při streamování z Anthropic API >> ', error);
      }
      yield { type: 'error', error: errorMessage };
    }
  }

  private getErrorMessage(error: unknown): string {
    const err = error as any;

    if (err instanceof APIError) {
      if (err.status === 429) {
        return 'Anthropic API rate limit exceeded. Please wait a moment before trying again.';
      }
      if (err.status === 503) {
        return 'Anthropic API is temporarily unavailable. Please try again later.';
      }
      if (err.status === 401 || err.status === 403) {
        return 'Anthropic API authentication failed. Please check your API key configuration.';
      }
      if (err.status === 404) {
        return 'The specified Anthropic model was not found.';
      }
      if (err.status && err.status >= 500) {
        return `Anthropic server error (${err.status}). Please try again later.`;
      }
      if (err.message?.includes('quota')) {
        return 'Anthropic API quota exceeded. Please check your account limits.';
      }
      return `Anthropic API error: ${err.message || 'Request failed'}`;
    }

    return 'Failed to generate response. Please try again.';
  }
}
