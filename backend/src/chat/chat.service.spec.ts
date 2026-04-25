jest.mock('@mikro-orm/core', () => ({}));
jest.mock('@mikro-orm/postgresql', () => ({}));
jest.mock('@mikro-orm/nestjs', () => ({
  InjectRepository: () => () => undefined,
}));
jest.mock('../entities/Chat', () => ({ Chat: class MockChat {} }));
jest.mock('../entities/Message', () => ({ Message: class MockMessage {} }));
jest.mock('../entities/Model', () => ({ Model: class MockModel {} }));
jest.mock('../entities/User', () => ({ User: class MockUser {} }));
jest.mock('../entities/Token', () => ({ Token: class MockToken {} }));
jest.mock('../entities/UsageLog', () => ({ UsageLog: class MockUsageLog {} }));
jest.mock('../llm/gemini/gemini.service', () => ({ GeminiService: class {} }));
jest.mock('../llm/anthropic/anthropic.service', () => ({
  AnthropicService: class {},
}));
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));
jest.mock('../date.utils', () => ({ nextMonthFirstDay: () => new Date() }));

import { NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { Chat } from '../entities/Chat';
import type { Model } from '../entities/Model';

function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    id: 'model-uuid-1',
    provider: 'gemini',
    name: 'gemini-2.5-flash',
    displayLabel: 'Gemini 2.5 Flash',
    iconKey: 'gemini',
    isEnabled: true,
    apiEndpoint: 'https://api.example.com',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as Model;
}

function makeChat(overrides: Partial<Chat> = {}): Chat {
  return {
    id: 'chat-uuid-1',
    title: 'Test chat',
    favourite: false,
    model: makeModel(),
    user: { id: 'user-uuid-1' },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as unknown as Chat;
}

describe('ChatService – patchChat', () => {
  let service: ChatService;
  let findOne: jest.Mock;
  let emFindOne: jest.Mock;
  let flush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    findOne = jest.fn();
    emFindOne = jest.fn();
    flush = jest.fn().mockResolvedValue(undefined);

    service = new ChatService(
      { findOne } as never,
      {} as never,
      { findOne: emFindOne, flush, create: jest.fn(), persist: jest.fn(), remove: jest.fn(), nativeUpdate: jest.fn(), getConnection: jest.fn(), getReference: jest.fn() } as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('aktualizuje titulek chatu', async () => {
    const chat = makeChat();
    findOne.mockResolvedValue(chat);

    const result = await service.patchChat('chat-uuid-1', 'user-uuid-1', { title: 'Nový titulek' });

    expect(result.title).toBe('Nový titulek');
    expect(flush).toHaveBeenCalled();
  });

  it('aktualizuje model chatu při mid-chat switchi', async () => {
    const chat = makeChat();
    const newModel = makeModel({ id: 'model-uuid-2', provider: 'anthropic', name: 'claude-haiku-4-5' });
    findOne.mockResolvedValue(chat);
    emFindOne.mockResolvedValue(newModel);

    const result = await service.patchChat('chat-uuid-1', 'user-uuid-1', { modelId: 'model-uuid-2' });

    expect(emFindOne).toHaveBeenCalledWith(expect.anything(), { id: 'model-uuid-2', deletedAt: null });
    expect(result.model).toBe(newModel);
    expect(flush).toHaveBeenCalled();
  });

  it('zachová původní model pokud modelId není předáno', async () => {
    const originalModel = makeModel();
    const chat = makeChat({ model: originalModel });
    findOne.mockResolvedValue(chat);

    const result = await service.patchChat('chat-uuid-1', 'user-uuid-1', { title: 'jen titulek' });

    expect(result.model).toBe(originalModel);
    expect(emFindOne).not.toHaveBeenCalled();
  });

  it('vyhodí NotFoundException při neznámém modelId', async () => {
    const chat = makeChat();
    findOne.mockResolvedValue(chat);
    emFindOne.mockResolvedValue(null);

    await expect(
      service.patchChat('chat-uuid-1', 'user-uuid-1', { modelId: 'neexistujici-uuid' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('podporuje více po sobě jdoucích switchů modelu', async () => {
    const chat = makeChat();
    const model2 = makeModel({ id: 'model-uuid-2', name: 'claude-haiku-4-5' });
    const model3 = makeModel({ id: 'model-uuid-3', name: 'gemini-2.0-flash', provider: 'gemini' });
    findOne.mockResolvedValue(chat);

    emFindOne.mockResolvedValueOnce(model2);
    await service.patchChat('chat-uuid-1', 'user-uuid-1', { modelId: 'model-uuid-2' });
    expect(chat.model).toBe(model2);

    emFindOne.mockResolvedValueOnce(model3);
    await service.patchChat('chat-uuid-1', 'user-uuid-1', { modelId: 'model-uuid-3' });
    expect(chat.model).toBe(model3);

    expect(flush).toHaveBeenCalledTimes(2);
  });

  it('vyhodí NotFoundException pokud chat neexistuje', async () => {
    findOne.mockResolvedValue(null);

    await expect(
      service.patchChat('neexistujici', 'user-uuid-1', {}),
    ).rejects.toThrow(NotFoundException);
  });

  it('vyhodí NotFoundException pokud chat patří jinému uživateli', async () => {
    const chat = makeChat({ user: { id: 'jiny-user' } as never });
    findOne.mockResolvedValue(chat);

    await expect(
      service.patchChat('chat-uuid-1', 'user-uuid-1', {}),
    ).rejects.toThrow(NotFoundException);
  });
});
