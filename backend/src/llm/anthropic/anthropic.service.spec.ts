import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { AnthropicService } from './anthropic.service';
import Anthropic, { APIError } from '@anthropic-ai/sdk';

jest.mock('@anthropic-ai/sdk');

const MockedAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

function makeConfigService(overrides: Record<string, string | undefined> = {}) {
  return {
    get: (key: string) => {
      const values: Record<string, string> = {
        ANTHROPIC_API_KEY: 'test-api-key',
        ANTHROPIC_MODEL: 'claude-haiku-3-5',
        ...overrides,
      };
      return values[key];
    },
  };
}

async function collectStream(gen: AsyncGenerator<unknown>): Promise<unknown[]> {
  const items: unknown[] = [];
  for await (const item of gen) {
    items.push(item);
  }
  return items;
}

describe('AnthropicService', () => {
  let service: AnthropicService;
  let mockCreate: jest.Mock;

  beforeEach(async () => {
    MockedAnthropic.mockClear();
    mockCreate = jest.fn();
    MockedAnthropic.mockImplementation(() => {
      return {
        messages: { create: mockCreate },
      } as unknown as Anthropic;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnthropicService,
        { provide: ConfigService, useValue: makeConfigService() },
      ],
    }).compile();

    service = module.get<AnthropicService>(AnthropicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('inicializuje Anthropic klienta s API klíčem', () => {
    expect(MockedAnthropic).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
  });

  it('nezavolá Anthropic konstruktor pokud chybí API klíč', async () => {
    MockedAnthropic.mockClear();
    const module = await Test.createTestingModule({
      providers: [
        AnthropicService,
        {
          provide: ConfigService,
          useValue: makeConfigService({ ANTHROPIC_API_KEY: undefined }),
        },
      ],
    }).compile();

    module.get<AnthropicService>(AnthropicService);
    expect(MockedAnthropic).not.toHaveBeenCalled();
  });

  it('generateTextStream vyhodí chybu pokud není client', async () => {
    const module = await Test.createTestingModule({
      providers: [
        AnthropicService,
        {
          provide: ConfigService,
          useValue: makeConfigService({ ANTHROPIC_API_KEY: undefined }),
        },
      ],
    }).compile();

    const svc = module.get<AnthropicService>(AnthropicService);
    await expect(
      collectStream(svc.generateTextStream('ahoj', [])),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('generateTextStream vrací textové chunky a usage', async () => {
    async function* fakeStream() {
      yield { type: 'message_start', message: { usage: { input_tokens: 10 } } };
      yield {
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: 'Ahoj' },
      };
      yield {
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: ' světe' },
      };
      yield { type: 'message_delta', usage: { output_tokens: 5 } };
      yield { type: 'message_stop' };
    }

    mockCreate.mockResolvedValue(fakeStream());

    const items = await collectStream(
      service.generateTextStream('test', [
        { role: 'user', content: 'předchozí' },
      ]),
    );

    expect(items).toEqual([
      { type: 'text', text: 'Ahoj' },
      { type: 'text', text: ' světe' },
      {
        type: 'usage',
        totalTokens: 15,
        promptTokens: 10,
        completionTokens: 5,
      },
    ]);
  });

  it('generateTextStream předá historii + nový prompt správně', async () => {
    async function* fakeStream() {
      yield { type: 'message_stop' };
    }
    mockCreate.mockResolvedValue(fakeStream());

    await collectStream(
      service.generateTextStream('nový prompt', [
        { role: 'user', content: 'první' },
        { role: 'assistant', content: 'odpověď' },
      ]),
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-3-5',
        messages: [
          { role: 'user', content: 'první' },
          { role: 'assistant', content: 'odpověď' },
          { role: 'user', content: 'nový prompt' },
        ],
      }),
      expect.anything(),
    );
  });

  it('generateTextStream přemapuje legacy model na podporovaný Anthropic model', async () => {
    async function* fakeStream() {
      yield { type: 'message_stop' };
    }
    mockCreate.mockResolvedValue(fakeStream());

    await collectStream(
      service.generateTextStream(
        'nový prompt',
        [{ role: 'user', content: 'první' }],
        'claude-3-haiku-20240307',
      ),
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-3-5',
      }),
      expect.anything(),
    );
  });

  it('generateTextStream použije model předaný z registru před fallbackem', async () => {
    async function* fakeStream() {
      yield { type: 'message_stop' };
    }
    mockCreate.mockResolvedValue(fakeStream());

    await collectStream(
      service.generateTextStream(
        'nový prompt',
        [{ role: 'user', content: 'první' }],
        'claude-3-5-sonnet-20241022',
      ),
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-3-5-sonnet-20241022',
      }),
      expect.anything(),
    );
  });

  it('generateTextStream ignoruje AbortError a ukončí stream', async () => {
    async function* fakeStream() {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    }
    mockCreate.mockResolvedValue(fakeStream());

    const items = await collectStream(service.generateTextStream('test', []));
    expect(items).toEqual([]);
  });

  it('generateTextStream převede APIError na InternalServerErrorException', async () => {
    async function* fakeStream() {
      const err = new APIError(429, undefined, 'rate limit', new Headers());
      throw err;
    }
    mockCreate.mockResolvedValue(fakeStream());

    await expect(
      collectStream(service.generateTextStream('test', [])),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('generateTextStream převede obecnou chybu na InternalServerErrorException', async () => {
    mockCreate.mockRejectedValue(new Error('network failure'));

    await expect(
      collectStream(service.generateTextStream('test', [])),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
