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
  private readonly model: string;
  private readonly logger = new Logger(AnthropicService.name);

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('ANTHROPIC_API_KEY');
    this.model =
      configService.get<string>('ANTHROPIC_MODEL') ??
      'claude-3-haiku-20240307';

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
    signal?: AbortSignal,
  ): AsyncGenerator<
    | { type: 'text'; text: string }
    | {
        type: 'usage';
        totalTokens: number;
        promptTokens: number | null;
        completionTokens: number | null;
      }
  > {
    if (!this.client) {
      throw new InternalServerErrorException(
        'Anthropic API key není nakonfigurován',
      );
    }

    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: 'user', content: prompt },
    ];

    let inputTokens: number | null = null;
    let outputTokens: number | null = null;

    try {
      const stream = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: 4096,
          messages,
          stream: true,
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
