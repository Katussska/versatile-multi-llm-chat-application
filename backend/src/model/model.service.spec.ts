jest.mock('@mikro-orm/core', () => ({}));
jest.mock('@mikro-orm/nestjs', () => ({
  InjectRepository: () => () => undefined,
}));
jest.mock('../entities/Model', () => ({
  Model: class MockModel {},
}));

import { ModelService } from './model.service';
import type { Model } from '../entities/Model';

function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    id: 'uuid-1',
    provider: 'anthropic',
    name: 'claude-haiku-3-5',
    displayLabel: 'Claude Haiku 4.5',
    iconKey: 'anthropic',
    isEnabled: true,
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as Model;
}

describe('ModelService', () => {
  const find = jest.fn();
  const repository = { find };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dotazuje pouze povolené modely seřazené dle createdAt', async () => {
    find.mockResolvedValue([]);
    const service = new ModelService(repository as never);

    await service.getEnabledModels();

    expect(find).toHaveBeenCalledWith(
      { deletedAt: null, isEnabled: true },
      { orderBy: { createdAt: 'ASC' } },
    );
  });

  it('serializuje metadata modelu správně do DTO tvaru', async () => {
    const model = makeModel();
    find.mockResolvedValue([model]);
    const service = new ModelService(repository as never);

    const models = await service.getEnabledModels();
    const dto = {
      id: models[0].id,
      provider: models[0].provider,
      name: models[0].name,
      displayLabel: models[0].displayLabel,
      iconKey: models[0].iconKey,
      isEnabled: models[0].isEnabled,
    };

    expect(dto).toEqual({
      id: 'uuid-1',
      provider: 'anthropic',
      name: 'claude-haiku-3-5',
      displayLabel: 'Claude Haiku 4.5',
      iconKey: 'anthropic',
      isEnabled: true,
    });
  });

  it('vrátí prázdné pole pokud nejsou povolené modely', async () => {
    find.mockResolvedValue([]);
    const service = new ModelService(repository as never);

    const result = await service.getEnabledModels();
    expect(result).toEqual([]);
  });

  it('vrátí více modelů zachovávajíce pořadí z repository', async () => {
    const gemini = makeModel({
      id: 'uuid-2',
      provider: 'gemini',
      name: 'gemini-2.5-flash',
      displayLabel: 'Gemini 2.5 Flash',
      iconKey: 'gemini',
    });
    const claude = makeModel();
    find.mockResolvedValue([gemini, claude]);
    const service = new ModelService(repository as never);

    const result = await service.getEnabledModels();
    expect(result).toHaveLength(2);
    expect(result[0].provider).toBe('gemini');
    expect(result[1].provider).toBe('anthropic');
  });
});
