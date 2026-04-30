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
jest.mock('../entities/ModelPricing', () => ({
  ModelPricing: class MockModelPricing {},
}));
jest.mock('../llm/gemini/gemini.service', () => ({ GeminiService: class {} }));
jest.mock('../llm/anthropic/anthropic.service', () => ({
  AnthropicService: class {},
}));
jest.mock('../llm/openai/openai.service', () => ({ OpenAIService: class {} }));
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
      {
        findOne: emFindOne,
        flush,
        create: jest.fn(),
        persist: jest.fn(),
        remove: jest.fn(),
        nativeUpdate: jest.fn(),
        getConnection: jest.fn(),
        getReference: jest.fn(),
      } as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('aktualizuje titulek chatu', async () => {
    const chat = makeChat();
    findOne.mockResolvedValue(chat);

    const result = await service.patchChat('chat-uuid-1', 'user-uuid-1', {
      title: 'Nový titulek',
    });

    expect(result.title).toBe('Nový titulek');
    expect(flush).toHaveBeenCalled();
  });

  it('aktualizuje model chatu při mid-chat switchi', async () => {
    const chat = makeChat();
    const newModel = makeModel({
      id: 'model-uuid-2',
      provider: 'anthropic',
      name: 'claude-haiku-4-5',
    });
    findOne.mockResolvedValue(chat);
    emFindOne.mockResolvedValue(newModel);

    const result = await service.patchChat('chat-uuid-1', 'user-uuid-1', {
      modelId: 'model-uuid-2',
    });

    expect(emFindOne).toHaveBeenCalledWith(expect.anything(), {
      id: 'model-uuid-2',
      deletedAt: null,
    });
    expect(result.model).toBe(newModel);
    expect(flush).toHaveBeenCalled();
  });

  it('zachová původní model pokud modelId není předáno', async () => {
    const originalModel = makeModel();
    const chat = makeChat({ model: originalModel });
    findOne.mockResolvedValue(chat);

    const result = await service.patchChat('chat-uuid-1', 'user-uuid-1', {
      title: 'jen titulek',
    });

    expect(result.model).toBe(originalModel);
    expect(emFindOne).not.toHaveBeenCalled();
  });

  it('vyhodí NotFoundException při neznámém modelId', async () => {
    const chat = makeChat();
    findOne.mockResolvedValue(chat);
    emFindOne.mockResolvedValue(null);

    await expect(
      service.patchChat('chat-uuid-1', 'user-uuid-1', {
        modelId: 'neexistujici-uuid',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('podporuje více po sobě jdoucích switchů modelu', async () => {
    const chat = makeChat();
    const model2 = makeModel({ id: 'model-uuid-2', name: 'claude-haiku-4-5' });
    const model3 = makeModel({
      id: 'model-uuid-3',
      name: 'gemini-2.0-flash',
      provider: 'gemini',
    });
    findOne.mockResolvedValue(chat);

    emFindOne.mockResolvedValueOnce(model2);
    await service.patchChat('chat-uuid-1', 'user-uuid-1', {
      modelId: 'model-uuid-2',
    });
    expect(chat.model).toBe(model2);

    emFindOne.mockResolvedValueOnce(model3);
    await service.patchChat('chat-uuid-1', 'user-uuid-1', {
      modelId: 'model-uuid-3',
    });
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

describe('ChatService – deleteChat', () => {
  let service: ChatService;
  let findOne: jest.Mock;
  let flush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    findOne = jest.fn();
    flush = jest.fn().mockResolvedValue(undefined);

    service = new ChatService(
      { findOne } as never,
      {} as never,
      { flush } as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('soft-deletuje chat nastavením deletedAt', async () => {
    const chat = makeChat();
    findOne.mockResolvedValue(chat);

    await service.deleteChat('chat-uuid-1', 'user-uuid-1');

    expect(chat.deletedAt).toBeInstanceOf(Date);
    expect(flush).toHaveBeenCalled();
  });

  it('vyhodí NotFoundException pro neexistující chat', async () => {
    findOne.mockResolvedValue(null);

    await expect(
      service.deleteChat('neexistuje', 'user-uuid-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('vyhodí NotFoundException pro chat jiného uživatele', async () => {
    findOne.mockResolvedValue(makeChat({ user: { id: 'jiny-user' } as never }));

    await expect(
      service.deleteChat('chat-uuid-1', 'user-uuid-1'),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ChatService – patchMessage', () => {
  let service: ChatService;
  let emFindOne: jest.Mock;
  let flush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    emFindOne = jest.fn();
    flush = jest.fn().mockResolvedValue(undefined);

    service = new ChatService(
      {} as never,
      {} as never,
      { findOne: emFindOne, flush } as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('aktualizuje obsah zprávy', async () => {
    const message = {
      id: 'msg-1',
      content: 'původní',
      chat: { id: 'chat-1', user: { id: 'user-1' } },
    };
    emFindOne.mockResolvedValue(message);

    await service.patchMessage('msg-1', 'chat-1', 'user-1', {
      content: 'nový obsah',
    });

    expect(message.content).toBe('nový obsah');
    expect(flush).toHaveBeenCalled();
  });

  it('vyhodí NotFoundException pro neexistující zprávu', async () => {
    emFindOne.mockResolvedValue(null);

    await expect(
      service.patchMessage('neexistuje', 'chat-1', 'user-1', {}),
    ).rejects.toThrow(NotFoundException);
  });

  it('vyhodí NotFoundException pro zprávu z jiného chatu', async () => {
    const message = {
      id: 'msg-1',
      content: 'x',
      chat: { id: 'jiny-chat', user: { id: 'user-1' } },
    };
    emFindOne.mockResolvedValue(message);

    await expect(
      service.patchMessage('msg-1', 'chat-1', 'user-1', {}),
    ).rejects.toThrow(NotFoundException);
  });

  it('vyhodí NotFoundException pro zprávu jiného uživatele', async () => {
    const message = {
      id: 'msg-1',
      content: 'x',
      chat: { id: 'chat-1', user: { id: 'jiny-user' } },
    };
    emFindOne.mockResolvedValue(message);

    await expect(
      service.patchMessage('msg-1', 'chat-1', 'user-1', {}),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ChatService – createChat', () => {
  let service: ChatService;
  let repoCreate: jest.Mock;
  let emFindOne: jest.Mock;
  let emCreate: jest.Mock;
  let emPersist: jest.Mock;
  let emFlush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repoCreate = jest.fn();
    emFindOne = jest.fn();
    emCreate = jest.fn();
    emPersist = jest.fn();
    emFlush = jest.fn().mockResolvedValue(undefined);

    service = new ChatService(
      { create: repoCreate } as never,
      {} as never,
      {
        findOne: emFindOne,
        create: emCreate,
        persist: emPersist,
        flush: emFlush,
      } as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('vytvoří chat s explicitním modelem', async () => {
    const user = { id: 'user-1' };
    const model = makeModel({ id: 'model-2' });
    const chat = makeChat({ user: user as never, model });
    emFindOne.mockResolvedValueOnce(user);
    emFindOne.mockResolvedValueOnce(model);
    repoCreate.mockReturnValue(chat);

    const result = await service.createChat('user-1', {
      modelId: 'model-2',
    } as never);

    expect(emFindOne).toHaveBeenCalledWith(expect.anything(), { id: 'user-1' });
    expect(emFindOne).toHaveBeenCalledWith(expect.anything(), {
      id: 'model-2',
      deletedAt: null,
    });
    expect(result).toBe(chat);
    expect(emFlush).toHaveBeenCalled();
  });

  it('vytvoří chat s výchozím modelem pokud modelId není předáno', async () => {
    const user = { id: 'user-1' };
    const defaultModel = makeModel();
    const chat = makeChat();
    emFindOne.mockResolvedValueOnce(user);
    emFindOne.mockResolvedValueOnce(defaultModel);
    repoCreate.mockReturnValue(chat);

    const result = await service.createChat('user-1', {} as never);

    expect(result).toBe(chat);
  });

  it('vyhodí NotFoundException pokud uživatel neexistuje', async () => {
    emFindOne.mockResolvedValueOnce(null);

    await expect(service.createChat('neexistuje', {} as never)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('vyhodí NotFoundException pokud zadaný model neexistuje', async () => {
    emFindOne.mockResolvedValueOnce({ id: 'user-1' });
    emFindOne.mockResolvedValueOnce(null);

    await expect(
      service.createChat('user-1', { modelId: 'neexistujici' } as never),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ChatService – getUserChats', () => {
  let service: ChatService;
  let repoFind: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repoFind = jest.fn();

    service = new ChatService(
      { find: repoFind } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('vrátí chaty uživatele seřazené od nejnovějšího', async () => {
    const chats = [makeChat({ id: 'c2' }), makeChat({ id: 'c1' })];
    repoFind.mockResolvedValue(chats);

    const result = await service.getUserChats('user-uuid-1');

    expect(repoFind).toHaveBeenCalledWith(
      { user: { id: 'user-uuid-1' }, deletedAt: null },
      { orderBy: { createdAt: 'DESC' } },
    );
    expect(result).toBe(chats);
  });

  it('vrátí prázdné pole pokud uživatel nemá chaty', async () => {
    repoFind.mockResolvedValue([]);

    const result = await service.getUserChats('user-uuid-1');

    expect(result).toEqual([]);
  });
});

describe('ChatService – getChatMessages', () => {
  let service: ChatService;
  let repoFindOne: jest.Mock;
  let emFind: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repoFindOne = jest.fn();
    emFind = jest.fn();

    service = new ChatService(
      { findOne: repoFindOne } as never,
      {} as never,
      { find: emFind } as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('vyhodí NotFoundException pokud chat neexistuje', async () => {
    repoFindOne.mockResolvedValue(null);

    await expect(
      service.getChatMessages('neexistuje', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('vyhodí NotFoundException pro chat jiného uživatele', async () => {
    repoFindOne.mockResolvedValue(
      makeChat({ user: { id: 'jiny-user' } as never }),
    );

    await expect(service.getChatMessages('chat-1', 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('vrátí aktivní zprávy bez versionGroupId s prázdným polem verzí', async () => {
    const chat = makeChat();
    repoFindOne.mockResolvedValue(chat);
    const msg1 = {
      id: 'msg-1',
      isActive: true,
      versionGroupId: null,
      createdAt: new Date(),
    };
    const msg2 = {
      id: 'msg-2',
      isActive: true,
      versionGroupId: null,
      createdAt: new Date(),
    };
    emFind.mockResolvedValue([msg1, msg2]);

    const result = await service.getChatMessages('chat-uuid-1', 'user-uuid-1');

    expect(result).toHaveLength(2);
    expect(result[0].message).toBe(msg1);
    expect(result[0].versions).toEqual([]);
  });

  it('seskupí aktivní i neaktivní verze zpráv podle versionGroupId', async () => {
    const chat = makeChat();
    repoFindOne.mockResolvedValue(chat);
    const groupId = 'group-1';
    const inactive = {
      id: 'msg-old',
      isActive: false,
      versionGroupId: groupId,
      createdAt: new Date('2026-01-01'),
    };
    const active = {
      id: 'msg-new',
      isActive: true,
      versionGroupId: groupId,
      createdAt: new Date('2026-01-02'),
    };
    emFind.mockResolvedValue([inactive, active]);

    const result = await service.getChatMessages('chat-uuid-1', 'user-uuid-1');

    expect(result).toHaveLength(1);
    expect(result[0].message).toBe(active);
    expect(result[0].versions).toHaveLength(2);
    expect(result[0].versions[0]).toBe(inactive);
    expect(result[0].versions[1]).toBe(active);
  });

  it('neaktivní zprávy bez versionGroupId nejsou zahrnuty ve výsledku', async () => {
    const chat = makeChat();
    repoFindOne.mockResolvedValue(chat);
    const active = {
      id: 'msg-1',
      isActive: true,
      versionGroupId: null,
      createdAt: new Date(),
    };
    const inactive = {
      id: 'msg-2',
      isActive: false,
      versionGroupId: null,
      createdAt: new Date(),
    };
    emFind.mockResolvedValue([active, inactive]);

    const result = await service.getChatMessages('chat-uuid-1', 'user-uuid-1');

    expect(result).toHaveLength(1);
    expect(result[0].message).toBe(active);
  });
});

describe('ChatService – activateVersion', () => {
  let service: ChatService;
  let emFindOne: jest.Mock;
  let emFind: jest.Mock;
  let emFlush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    emFindOne = jest.fn();
    emFind = jest.fn();
    emFlush = jest.fn().mockResolvedValue(undefined);

    service = new ChatService(
      {} as never,
      {} as never,
      { findOne: emFindOne, find: emFind, flush: emFlush } as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('nastaví vybranou zprávu jako aktivní, ostatní verze jako neaktivní', async () => {
    const groupId = 'group-1';
    const target = {
      id: 'msg-new',
      chat: { id: 'chat-1', user: { id: 'user-1' } },
      versionGroupId: groupId,
      isActive: false,
    };
    const sibling = { id: 'msg-old', isActive: true };
    emFindOne.mockResolvedValue(target);
    emFind.mockResolvedValue([sibling, target]);

    await service.activateVersion('msg-new', 'chat-1', 'user-1');

    expect(sibling.isActive).toBe(false);
    expect(target.isActive).toBe(true);
    expect(emFlush).toHaveBeenCalled();
  });

  it('vyhodí NotFoundException pro zprávu bez versionGroupId', async () => {
    const msg = {
      id: 'msg-1',
      chat: { id: 'chat-1', user: { id: 'user-1' } },
      versionGroupId: null,
    };
    emFindOne.mockResolvedValue(msg);

    await expect(
      service.activateVersion('msg-1', 'chat-1', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('vyhodí NotFoundException pro neexistující zprávu', async () => {
    emFindOne.mockResolvedValue(null);

    await expect(
      service.activateVersion('neexistuje', 'chat-1', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('vyhodí NotFoundException pro zprávu z jiného chatu', async () => {
    const msg = {
      id: 'msg-1',
      chat: { id: 'jiny-chat', user: { id: 'user-1' } },
      versionGroupId: 'group-1',
    };
    emFindOne.mockResolvedValue(msg);

    await expect(
      service.activateVersion('msg-1', 'chat-1', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('vyhodí NotFoundException pro zprávu jiného uživatele', async () => {
    const msg = {
      id: 'msg-1',
      chat: { id: 'chat-1', user: { id: 'jiny-user' } },
      versionGroupId: 'group-1',
    };
    emFindOne.mockResolvedValue(msg);

    await expect(
      service.activateVersion('msg-1', 'chat-1', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ChatService – addMessage', () => {
  let service: ChatService;
  let repoFindOne: jest.Mock;
  let emCreate: jest.Mock;
  let emPersist: jest.Mock;
  let emFlush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repoFindOne = jest.fn();
    emCreate = jest.fn();
    emPersist = jest.fn();
    emFlush = jest.fn().mockResolvedValue(undefined);

    service = new ChatService(
      { findOne: repoFindOne } as never,
      {} as never,
      { create: emCreate, persist: emPersist, flush: emFlush } as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('vytvoří zprávu pro existující chat', async () => {
    const chat = makeChat();
    const message = {
      id: 'msg-new',
      content: 'hello',
      path: 'user',
      isActive: true,
    };
    repoFindOne.mockResolvedValue(chat);
    emCreate.mockReturnValue(message);

    const result = await service.addMessage('user-uuid-1', {
      chatId: 'chat-uuid-1',
      content: 'hello',
      path: 'user',
    });

    expect(emCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        chat,
        content: 'hello',
        path: 'user',
        isActive: true,
      }),
    );
    expect(result).toBe(message);
    expect(emFlush).toHaveBeenCalled();
  });

  it('vyhodí NotFoundException pokud chat neexistuje', async () => {
    repoFindOne.mockResolvedValue(null);

    await expect(
      service.addMessage('user-1', {
        chatId: 'neexistuje',
        content: 'x',
        path: 'user',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('vyhodí NotFoundException pro chat jiného uživatele', async () => {
    repoFindOne.mockResolvedValue(
      makeChat({ user: { id: 'jiny-user' } as never }),
    );

    await expect(
      service.addMessage('user-1', {
        chatId: 'chat-1',
        content: 'x',
        path: 'user',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ChatService – streamResponse', () => {
  let service: ChatService;
  let repoFindOne: jest.Mock;
  let tokenFindOne: jest.Mock;
  let emFindOne: jest.Mock;
  let emFind: jest.Mock;
  let emCreate: jest.Mock;
  let emPersist: jest.Mock;
  let emFlush: jest.Mock;
  let geminiStream: jest.Mock;
  let geminiInvalidate: jest.Mock;
  let res: { write: jest.Mock; end: jest.Mock; on: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    repoFindOne = jest.fn();
    tokenFindOne = jest.fn().mockResolvedValue(null);
    emFindOne = jest.fn().mockResolvedValue(null);
    emFind = jest.fn().mockResolvedValue([]);
    emCreate = jest.fn();
    emPersist = jest.fn();
    emFlush = jest.fn().mockResolvedValue(undefined);
    geminiStream = jest.fn();
    geminiInvalidate = jest.fn();

    res = { write: jest.fn(), end: jest.fn(), on: jest.fn() };

    service = new ChatService(
      { findOne: repoFindOne } as never,
      { findOne: tokenFindOne } as never,
      {
        findOne: emFindOne,
        find: emFind,
        create: emCreate,
        persist: emPersist,
        flush: emFlush,
        remove: jest.fn(),
        nativeUpdate: jest.fn(),
        getReference: jest.fn(),
      } as never,
      {
        generateTextStream: geminiStream,
        invalidateSession: geminiInvalidate,
      } as never,
      {} as never,
      {} as never,
    );
  });

  it('vyhodí NotFoundException pokud chat neexistuje', async () => {
    repoFindOne.mockResolvedValue(null);

    await expect(
      service.streamResponse('neexistuje', 'user-1', 'ahoj', res as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('vyhodí NotFoundException pro chat jiného uživatele', async () => {
    repoFindOne.mockResolvedValue(
      makeChat({ user: { id: 'jiny-user' } as never }),
    );

    await expect(
      service.streamResponse(
        'chat-uuid-1',
        'user-uuid-1',
        'ahoj',
        res as never,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('vyhodí HttpException 429 při překročení budget limitu', async () => {
    repoFindOne.mockResolvedValue(makeChat());
    tokenFindOne.mockResolvedValue({
      usedDollars: 10,
      dollarLimit: 10,
      resetAt: new Date(Date.now() + 86_400_000),
    });

    await expect(
      service.streamResponse(
        'chat-uuid-1',
        'user-uuid-1',
        'ahoj',
        res as never,
      ),
    ).rejects.toMatchObject({ status: 429 });
  });

  it('resetuje budget a pokračuje ve streamování pokud resetAt je v minulosti', async () => {
    const chat = makeChat();
    repoFindOne.mockResolvedValue(chat);
    const token = {
      usedDollars: 5,
      dollarLimit: 3,
      resetAt: new Date(Date.now() - 1000),
    };
    tokenFindOne.mockResolvedValue(token);

    const userMsg = {
      id: 'user-msg',
      content: '',
      path: 'user',
      isActive: true,
    };
    const assistantMsg = {
      id: 'asst-msg',
      content: '',
      path: 'model',
      isActive: true,
    };
    emCreate.mockReturnValueOnce(userMsg).mockReturnValueOnce(assistantMsg);

    async function* emptyStream() {}
    geminiStream.mockReturnValue(emptyStream());

    await service.streamResponse(
      'chat-uuid-1',
      'user-uuid-1',
      'ahoj',
      res as never,
    );

    expect(token.usedDollars).toBe(0);
    expect(emFlush).toHaveBeenCalled();
  });

  it('zapisuje chunky a ukončí stream správně', async () => {
    const chat = makeChat();
    repoFindOne.mockResolvedValue(chat);

    const userMsg = {
      id: 'user-msg',
      content: '',
      path: 'user',
      isActive: true,
    };
    const assistantMsg = {
      id: 'asst-msg',
      content: '',
      path: 'model',
      isActive: true,
    };
    emCreate.mockReturnValueOnce(userMsg).mockReturnValueOnce(assistantMsg);

    async function* fakeStream() {
      yield { type: 'text' as const, text: 'Ahoj' };
      yield { type: 'text' as const, text: ' světe' };
      yield {
        type: 'usage' as const,
        totalTokens: 10,
        promptTokens: 5,
        completionTokens: 5,
      };
    }
    geminiStream.mockReturnValue(fakeStream());

    await service.streamResponse(
      'chat-uuid-1',
      'user-uuid-1',
      'hello',
      res as never,
    );

    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining('"chunk":"Ahoj"'),
    );
    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining('"done":true'),
    );
    expect(assistantMsg.content).toBe('Ahoj světe');
    expect(res.end).toHaveBeenCalled();
  });

  it('zapíše chybovou zprávu do response při LLM chybě', async () => {
    const chat = makeChat();
    repoFindOne.mockResolvedValue(chat);

    const userMsg = {
      id: 'user-msg',
      content: '',
      path: 'user',
      isActive: true,
    };
    const assistantMsg = {
      id: 'asst-msg',
      content: '',
      path: 'model',
      isActive: true,
    };
    emCreate.mockReturnValueOnce(userMsg).mockReturnValueOnce(assistantMsg);

    async function* errorStream() {
      yield { type: 'error' as const, error: 'Rate limit exceeded' };
    }
    geminiStream.mockReturnValue(errorStream());

    await service.streamResponse(
      'chat-uuid-1',
      'user-uuid-1',
      'hello',
      res as never,
    );

    expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"error"'));
    expect(res.end).toHaveBeenCalled();
  });
});
