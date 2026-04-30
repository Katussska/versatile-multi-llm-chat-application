jest.mock('@google/generative-ai');

import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiService } from './gemini.service';

jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

const mockSendMessage = jest.fn();
const mockSendMessageStream = jest.fn();
const mockStartChat = jest.fn();
const mockGetGenerativeModel = jest.fn();

const MockedGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

function makeConfigService() {
  return {
    getOrThrow: (key: string) => {
      if (key === 'GEMINI_API_KEY') return 'test-key';
      throw new Error(`Missing config key: ${key}`);
    },
  } as unknown as ConfigService;
}

async function collectStream(gen: AsyncGenerator<unknown>): Promise<unknown[]> {
  const items: unknown[] = [];
  for await (const item of gen) {
    items.push(item);
  }
  return items;
}

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStartChat.mockReturnValue({
      sendMessage: mockSendMessage,
      sendMessageStream: mockSendMessageStream,
    });
    mockGetGenerativeModel.mockReturnValue({ startChat: mockStartChat });
    MockedGoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }) as unknown as GoogleGenerativeAI);

    service = new GeminiService(makeConfigService());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('inicializuje GoogleGenerativeAI s API klíčem', () => {
    expect(MockedGoogleGenerativeAI).toHaveBeenCalledWith('test-key');
  });

  describe('generateText', () => {
    it('vrátí výsledek a sessionId', async () => {
      mockSendMessage.mockResolvedValue({ response: { text: () => 'Odpověď modelu' } });

      const result = await service.generateText({ prompt: 'Ahoj', sessionId: 'sess-1' });

      expect(result.result).toBe('Odpověď modelu');
      expect(result.sessionId).toBe('sess-1');
    });

    it('vyhodí InternalServerErrorException při chybě API', async () => {
      mockSendMessage.mockRejectedValue(new Error('network error'));

      await expect(
        service.generateText({ prompt: 'test', sessionId: undefined }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('opakovaně používá stejnou session pro stejné sessionId', async () => {
      mockSendMessage.mockResolvedValue({ response: { text: () => 'ok' } });

      await service.generateText({ prompt: 'první', sessionId: 'sess-abc' });
      await service.generateText({ prompt: 'druhý', sessionId: 'sess-abc' });

      expect(mockStartChat).toHaveBeenCalledTimes(1);
    });

    it('vytváří novou session pro každé nové sessionId', async () => {
      mockSendMessage.mockResolvedValue({ response: { text: () => 'ok' } });

      await service.generateText({ prompt: 'test', sessionId: 'sess-1' });
      await service.generateText({ prompt: 'test', sessionId: 'sess-2' });

      expect(mockStartChat).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidateSession', () => {
    it('po invalidaci vytvoří novou session pro stejné sessionId', async () => {
      mockSendMessage.mockResolvedValue({ response: { text: () => 'ok' } });

      await service.generateText({ prompt: 'první', sessionId: 'sess-x' });
      service.invalidateSession('sess-x');
      await service.generateText({ prompt: 'druhý', sessionId: 'sess-x' });

      expect(mockStartChat).toHaveBeenCalledTimes(2);
    });

    it('invalidace neexistující session nehodí chybu', () => {
      expect(() => service.invalidateSession('neexistuje')).not.toThrow();
    });
  });

  describe('generateTextStream', () => {
    it('vrací textové chunky a usage', async () => {
      async function* fakeStream() {
        yield { text: () => 'Ahoj' };
        yield { text: () => ' světe' };
        yield { text: () => '' };
      }
      mockSendMessageStream.mockResolvedValue({
        stream: fakeStream(),
        response: Promise.resolve({
          usageMetadata: { totalTokenCount: 15, promptTokenCount: 10, candidatesTokenCount: 5 },
        }),
      });

      const items = await collectStream(service.generateTextStream('test', 'gemini-2.5-flash', 'sess-1'));

      expect(items).toEqual([
        { type: 'text', text: 'Ahoj' },
        { type: 'text', text: ' světe' },
        { type: 'usage', totalTokens: 15, promptTokens: 10, completionTokens: 5 },
      ]);
    });

    it('použije předaný model', async () => {
      async function* fakeStream() {}
      mockSendMessageStream.mockResolvedValue({
        stream: fakeStream(),
        response: Promise.resolve({ usageMetadata: {} }),
      });

      await collectStream(service.generateTextStream('test', 'gemini-2.5-pro'));

      expect(mockGetGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-2.5-pro' }),
      );
    });

    it('vrátí nulové tokeny pokud usage metadata chybí', async () => {
      async function* fakeStream() {}
      mockSendMessageStream.mockResolvedValue({
        stream: fakeStream(),
        response: Promise.resolve({ usageMetadata: undefined }),
      });

      const items = await collectStream(service.generateTextStream('test'));
      expect(items).toContainEqual({
        type: 'usage',
        totalTokens: 0,
        promptTokens: null,
        completionTokens: null,
      });
    });

    it('ignoruje AbortError a vrátí prázdný stream', async () => {
      async function* fakeStream() {
        const err = new Error('aborted');
        err.name = 'AbortError';
        throw err;
      }
      mockSendMessageStream.mockResolvedValue({
        stream: fakeStream(),
        response: Promise.resolve({ usageMetadata: {} }),
      });

      const items = await collectStream(service.generateTextStream('test'));
      expect(items).toEqual([]);
    });

    it('vrátí chybový objekt při rate limit (429)', async () => {
      mockSendMessageStream.mockRejectedValue({ status: 429, message: 'rate limited' });

      const items = await collectStream(service.generateTextStream('test'));
      expect(items).toContainEqual({
        type: 'error',
        error: 'Too many requests to Gemini API. Please wait a moment before trying again.',
      });
    });

    it('vrátí chybový objekt při nedostupnosti API (503)', async () => {
      mockSendMessageStream.mockRejectedValue({ status: 503, message: 'service unavailable' });

      const items = await collectStream(service.generateTextStream('test'));
      expect(items).toContainEqual({
        type: 'error',
        error: 'The Gemini model is currently experiencing high demand. Please try again in a moment.',
      });
    });

    it('vrátí chybový objekt při chybě s klíčovým slovem "quota"', async () => {
      mockSendMessageStream.mockRejectedValue(new Error('quota exceeded for this project'));

      const items = await collectStream(service.generateTextStream('test'));
      expect(items).toContainEqual({
        type: 'error',
        error: 'Gemini API quota exceeded. Please check your account limits.',
      });
    });

    it('vrátí chybový objekt při obecné chybě', async () => {
      mockSendMessageStream.mockRejectedValue(new Error('network error'));

      const items = await collectStream(service.generateTextStream('test'));
      expect(items).toContainEqual({
        type: 'error',
        error: 'Failed to generate response. Please try again.',
      });
    });

    it('předá systémovou instrukci do modelu', async () => {
      async function* fakeStream() {}
      mockSendMessageStream.mockResolvedValue({
        stream: fakeStream(),
        response: Promise.resolve({ usageMetadata: {} }),
      });

      await collectStream(
        service.generateTextStream('test', undefined, undefined, undefined, undefined, 'Jsi asistent.'),
      );

      expect(mockGetGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({ systemInstruction: 'Jsi asistent.' }),
      );
    });
  });
});
