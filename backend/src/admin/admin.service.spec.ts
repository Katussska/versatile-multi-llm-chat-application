jest.mock('@mikro-orm/core', () => ({}));
jest.mock('@mikro-orm/nestjs', () => ({ InjectRepository: () => () => undefined }));
jest.mock('@mikro-orm/postgresql', () => ({}));
jest.mock('../entities/User', () => ({ User: class MockUser {} }));
jest.mock('../entities/UserRole', () => ({ UserRole: { USER: 'USER', ADMIN: 'ADMIN' } }));

import { AdminService } from './admin.service';
import { UserRole } from '../entities/UserRole';

function makeService(overrides: {
  userCount?: jest.Mock;
  emExecute?: jest.Mock;
} = {}) {
  const userCount = overrides.userCount ?? jest.fn().mockResolvedValue(0);
  const emExecute = overrides.emExecute ?? jest.fn().mockResolvedValue([]);

  const service = new AdminService(
    { count: userCount } as never,
    { execute: emExecute } as never,
  );

  return { service, userCount, emExecute };
}

describe('AdminService – getUsers', () => {
  it('vrátí seznam uživatelů se správnou strukturou', async () => {
    const emExecute = jest.fn()
      .mockResolvedValueOnce([
        { id: 'u1', email: 'a@test.cz', name: 'Alice', role: UserRole.ADMIN, created_at: new Date('2026-01-01') },
      ])
      .mockResolvedValueOnce([
        { user_id: 'u1', dollar_limit: '10.00', used_dollars: '2.50' },
      ]);

    const { service } = makeService({ emExecute });
    const result = await service.getUsers();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'u1',
      email: 'a@test.cz',
      name: 'Alice',
      role: UserRole.ADMIN,
      budget: { dollarLimit: 10, usedDollars: 2.5 },
    });
  });

  it('vrátí budget: null pro uživatele bez tokenu', async () => {
    const emExecute = jest.fn()
      .mockResolvedValueOnce([
        { id: 'u2', email: 'b@test.cz', name: 'Bob', role: UserRole.USER, created_at: new Date() },
      ])
      .mockResolvedValueOnce([]);

    const { service } = makeService({ emExecute });
    const result = await service.getUsers();

    expect(result[0].budget).toBeNull();
  });

  it('správně parsuje dollarLimit: null', async () => {
    const emExecute = jest.fn()
      .mockResolvedValueOnce([
        { id: 'u3', email: 'c@test.cz', name: 'Carol', role: UserRole.USER, created_at: new Date() },
      ])
      .mockResolvedValueOnce([
        { user_id: 'u3', dollar_limit: null, used_dollars: '0.00' },
      ]);

    const { service } = makeService({ emExecute });
    const result = await service.getUsers();

    expect(result[0].budget?.dollarLimit).toBeNull();
    expect(result[0].budget?.usedDollars).toBe(0);
  });
});

describe('AdminService – getStats', () => {
  it('vrátí správné statistiky', async () => {
    const userCount = jest.fn().mockResolvedValue(42);
    const emExecute = jest.fn()
      .mockResolvedValueOnce([{ count: '5' }])
      .mockResolvedValueOnce([{ name: 'gemini-2.5-flash' }]);

    const { service } = makeService({ userCount, emExecute });
    const result = await service.getStats('2026-01-01', '2026-01-31');

    expect(result.totalUsers).toBe(42);
    expect(result.activeUsers).toBe(5);
    expect(result.mostUsedModel).toBe('gemini-2.5-flash');
  });

  it('vrátí mostUsedModel: null pokud žádné chaty v období', async () => {
    const emExecute = jest.fn()
      .mockResolvedValueOnce([{ count: '0' }])
      .mockResolvedValueOnce([]);

    const { service } = makeService({ userCount: jest.fn().mockResolvedValue(10), emExecute });
    const result = await service.getStats('2026-01-01', '2026-01-31');

    expect(result.mostUsedModel).toBeNull();
  });

  it('posune horní hranici data o +1 den (toDate je exkluzivní)', async () => {
    const emExecute = jest.fn()
      .mockResolvedValueOnce([{ count: '0' }])
      .mockResolvedValueOnce([]);
    const userCount = jest.fn().mockResolvedValue(0);

    const { service } = makeService({ userCount, emExecute });
    await service.getStats('2026-01-01', '2026-01-15');

    const activeUsersCall = emExecute.mock.calls[0];
    const toDateParam = activeUsersCall[1][1] as Date;
    expect(toDateParam.getUTCDate()).toBe(16);
  });
});

describe('AdminService – getChartData', () => {
  it('vrátí mapované řádky s číselnými hodnotami', async () => {
    const emExecute = jest.fn().mockResolvedValue([
      {
        date: '2026-01-10',
        model_name: 'claude-haiku-4-5',
        model_provider: 'anthropic',
        tokens_in: '100',
        tokens_out: '50',
        cost: '0.001',
      },
    ]);

    const { service } = makeService({ emExecute });
    const result = await service.getChartData('2026-01-01', '2026-01-31');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: '2026-01-10',
      modelName: 'claude-haiku-4-5',
      modelProvider: 'anthropic',
      tokensIn: 100,
      tokensOut: 50,
      cost: 0.001,
    });
  });

  it('vrátí prázdné pole pokud žádná data', async () => {
    const { service } = makeService({ emExecute: jest.fn().mockResolvedValue([]) });
    const result = await service.getChartData('2026-01-01', '2026-01-31');
    expect(result).toEqual([]);
  });

  it('přidá WHERE podmínku pro provider', async () => {
    const emExecute = jest.fn().mockResolvedValue([]);
    const { service } = makeService({ emExecute });

    await service.getChartData('2026-01-01', '2026-01-31', 'anthropic');

    const sql: string = emExecute.mock.calls[0][0];
    expect(sql).toContain('ul.model_provider = ?');
  });

  it('přidá WHERE podmínku pro model', async () => {
    const emExecute = jest.fn().mockResolvedValue([]);
    const { service } = makeService({ emExecute });

    await service.getChartData('2026-01-01', '2026-01-31', undefined, 'gemini-2.5-flash');

    const sql: string = emExecute.mock.calls[0][0];
    expect(sql).toContain('ul.model_name = ?');
  });

  it('přidá WHERE podmínku pro userId', async () => {
    const emExecute = jest.fn().mockResolvedValue([]);
    const { service } = makeService({ emExecute });

    await service.getChartData('2026-01-01', '2026-01-31', undefined, undefined, 'user-uuid-1');

    const sql: string = emExecute.mock.calls[0][0];
    expect(sql).toContain('ul.user_id = ?');
  });

  it('kombinuje více filtrů a předá správné parametry', async () => {
    const emExecute = jest.fn().mockResolvedValue([]);
    const { service } = makeService({ emExecute });

    await service.getChartData('2026-01-01', '2026-01-31', 'gemini', 'gemini-2.5-flash', 'user-1');

    const params: unknown[] = emExecute.mock.calls[0][1];
    expect(params).toContain('gemini');
    expect(params).toContain('gemini-2.5-flash');
    expect(params).toContain('user-1');
  });
});
