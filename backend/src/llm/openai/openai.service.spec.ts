import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import OpenAI, { APIError } from 'openai';

jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

jest.mock('openai');

const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

function makeConfigService(overrides: Record<string, string | undefined> = {}) {
  return {
    get: (key: string) => {
      const values: Record<string, string> = {
        OPENAI_API_KEY: 'test-api-key',
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

describe('OpenAIService', () => {
  let service: OpenAIService;
  let mockCreate: jest.Mock;

  beforeEach(async () => {
    MockedOpenAI.mockClear();
    mockCreate = jest.fn();
    MockedOpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }) as unknown as OpenAI);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        { provide: ConfigService, useValue: makeConfigService() },
      ],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('inicializuje OpenAI klienta s API klíčem', () => {
    expect(MockedOpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
  });

  it('nezavolá OpenAI konstruktor pokud chybí API klíč', async () => {
    MockedOpenAI.mockClear();
    const module = await Test.createTestingModule({
      providers: [
        OpenAIService,
        { provide: ConfigService, useValue: makeConfigService({ OPENAI_API_KEY: undefined }) },
      ],
    }).compile();

    module.get<OpenAIService>(OpenAIService);
    expect(MockedOpenAI).not.toHaveBeenCalled();
  });

  it('generateTextStream vrátí chybový objekt pokud není client', async () => {
    const module = await Test.createTestingModule({
      providers: [
        OpenAIService,
        { provide: ConfigService, useValue: makeConfigService({ OPENAI_API_KEY: undefined }) },
      ],
    }).compile();

    const svc = module.get<OpenAIService>(OpenAIService);
    const items = await collectStream(svc.generateTextStream('ahoj', []));
    expect(items).toEqual([{ type: 'error', error: 'OpenAI API key is not configured' }]);
  });

  it('generateTextStream vrací textové chunky a usage', async () => {
    async function* fakeStream() {
      yield { choices: [{ delta: { content: 'Ahoj' } }], usage: null };
      yield { choices: [{ delta: { content: ' světe' } }], usage: null };
      yield { choices: [{ delta: {} }], usage: { prompt_tokens: 10, completion_tokens: 5 } };
    }
    mockCreate.mockResolvedValue(fakeStream());

    const items = await collectStream(service.generateTextStream('test', []));

    expect(items).toEqual([
      { type: 'text', text: 'Ahoj' },
      { type: 'text', text: ' světe' },
      { type: 'usage', totalTokens: 15, promptTokens: 10, completionTokens: 5 },
    ]);
  });

  it('generateTextStream předá historii, systémový prompt a nový prompt správně', async () => {
    async function* fakeStream() {
      yield { choices: [{ delta: {} }], usage: null };
    }
    mockCreate.mockResolvedValue(fakeStream());

    await collectStream(
      service.generateTextStream(
        'nový prompt',
        [
          { role: 'user', content: 'první' },
          { role: 'assistant', content: 'odpověď' },
        ],
        undefined,
        undefined,
        'Jsi asistent.',
      ),
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: 'Jsi asistent.' },
          { role: 'user', content: 'první' },
          { role: 'assistant', content: 'odpověď' },
          { role: 'user', content: 'nový prompt' },
        ],
      }),
      expect.anything(),
    );
  });

  it('generateTextStream použije předaný model místo fallbacku', async () => {
    async function* fakeStream() {
      yield { choices: [{ delta: {} }], usage: null };
    }
    mockCreate.mockResolvedValue(fakeStream());

    await collectStream(service.generateTextStream('prompt', [], 'gpt-5.4'));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-5.4' }),
      expect.anything(),
    );
  });

  it('generateTextStream vrátí nulové tokeny pokud chybí usage chunk', async () => {
    async function* fakeStream() {
      yield { choices: [{ delta: { content: 'text' } }], usage: null };
    }
    mockCreate.mockResolvedValue(fakeStream());

    const items = await collectStream(service.generateTextStream('test', []));
    expect(items).toContainEqual({
      type: 'usage',
      totalTokens: 0,
      promptTokens: null,
      completionTokens: null,
    });
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

  it('generateTextStream vrátí chybový objekt při rate limit (429)', async () => {
    async function* fakeStream() {
      const err = new APIError(429, undefined, 'rate limited', new Headers());
      Object.assign(err, { status: 429 });
      throw err;
    }
    mockCreate.mockResolvedValue(fakeStream());

    const items = await collectStream(service.generateTextStream('test', []));
    expect(items).toContainEqual({
      type: 'error',
      error: 'OpenAI API rate limit exceeded. Please wait a moment before trying again.',
    });
  });

  it('generateTextStream vrátí chybový objekt při auth chybě (401)', async () => {
    async function* fakeStream() {
      const err = new APIError(401, undefined, 'unauthorized', new Headers());
      Object.assign(err, { status: 401 });
      throw err;
    }
    mockCreate.mockResolvedValue(fakeStream());

    const items = await collectStream(service.generateTextStream('test', []));
    expect(items).toContainEqual({
      type: 'error',
      error: 'OpenAI API authentication failed. Please check your API key configuration.',
    });
  });

  it('generateTextStream vrátí chybový objekt při obecné chybě', async () => {
    mockCreate.mockRejectedValue(new Error('network failure'));

    const items = await collectStream(service.generateTextStream('test', []));
    expect(items).toContainEqual({
      type: 'error',
      error: 'Failed to generate response. Please try again.',
    });
  });
});
