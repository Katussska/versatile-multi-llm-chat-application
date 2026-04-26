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
    | {
        type: 'usage';
        totalTokens: number;
        promptTokens: number | null;
        completionTokens: number | null;
        cacheWriteTokens: number | null;
        cacheReadTokens: number | null;
      }
  > {
    if (!this.client) {
      throw new InternalServerErrorException(
        'Anthropic API key není nakonfigurován',
      );
    }

    // Mark the last history message with cache_control to cache the growing conversation prefix
    const historyParams: Anthropic.MessageParam[] = history.map((msg, i) => {
      if (i === history.length - 1) {
        return {
          role: msg.role,
          content: [{ type: 'text' as const, text: msg.content, cache_control: { type: 'ephemeral' as const } }],
        };
      }
      return { role: msg.role, content: msg.content };
    });

    const messages: Anthropic.MessageParam[] = [
      ...historyParams,
      { role: 'user', content: prompt },
    ];

    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    let cacheWriteTokens: number | null = null;
    let cacheReadTokens: number | null = null;

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
          cacheWriteTokens = event.message.usage.cache_creation_input_tokens ?? null;
          cacheReadTokens = event.message.usage.cache_read_input_tokens ?? null;
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
          cacheWriteTokens,
          cacheReadTokens,
        };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      if (error instanceof APIError) {
        this.logger.error(
          `Anthropic API chyba ${error.status}: ${error.message}`,
        );
        throw new InternalServerErrorException(
          `Anthropic API selhalo: ${error.message}`,
        );
      }
      this.logger.error('Chyba při streamování z Anthropic API >> ', error);
      throw new InternalServerErrorException('AI generování selhalo');
    }
  }
}
