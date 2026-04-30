jest.mock('@mikro-orm/core', () => ({}));
jest.mock('@mikro-orm/nestjs', () => ({ InjectRepository: () => () => undefined }));
jest.mock('@mikro-orm/postgresql', () => ({}));
jest.mock('../entities/User', () => ({ User: class MockUser {} }));
jest.mock('../entities/Account', () => ({ Account: class MockAccount {} }));
jest.mock('../entities/Session', () => ({ Session: class MockSession {} }));
jest.mock('../entities/Token', () => ({ Token: class MockToken {} }));
jest.mock('../entities/Chat', () => ({ Chat: class MockChat {} }));
jest.mock('../entities/UserRole', () => ({ UserRole: { USER: 'USER', ADMIN: 'ADMIN' } }));
jest.mock('better-auth/crypto', () => ({ hashPassword: jest.fn().mockResolvedValue('hashed-pw') }));
jest.mock('../date.utils', () => ({ nextMonthFirstDay: jest.fn(() => new Date('2026-06-01T00:00:00Z')) }));

import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRole } from '../entities/UserRole';
import { hashPassword } from 'better-auth/crypto';

function makeUser(overrides: Record<string, unknown> = {}) {
  return { id: 'user-1', email: 'test@example.com', name: 'test', role: UserRole.USER, deletedAt: null, ...overrides };
}

function makeToken(overrides: Record<string, unknown> = {}) {
  return {
    id: 'token-1',
    dollarLimit: 10,
    usedDollars: 2,
    resetAt: new Date('2026-06-01T00:00:00Z'),
    ...overrides,
  };
}

function makeService(overrides: {
  userFindOne?: jest.Mock;
  userFind?: jest.Mock;
  userCount?: jest.Mock;
  tokenFindOne?: jest.Mock;
  tokenFind?: jest.Mock;
  flush?: jest.Mock;
  emFindOne?: jest.Mock;
  emExecute?: jest.Mock;
  persist?: jest.Mock;
  remove?: jest.Mock;
  nativeDelete?: jest.Mock;
  nativeUpdate?: jest.Mock;
} = {}) {
  const userFindOne = overrides.userFindOne ?? jest.fn();
  const userFind = overrides.userFind ?? jest.fn().mockResolvedValue([]);
  const tokenFindOne = overrides.tokenFindOne ?? jest.fn();
  const tokenFind = overrides.tokenFind ?? jest.fn().mockResolvedValue([]);
  const flush = overrides.flush ?? jest.fn().mockResolvedValue(undefined);
  const emFindOne = overrides.emFindOne ?? jest.fn();
  const emExecute = overrides.emExecute ?? jest.fn().mockResolvedValue([]);
  const persist = overrides.persist ?? jest.fn();
  const remove = overrides.remove ?? jest.fn();
  const nativeDelete = overrides.nativeDelete ?? jest.fn().mockResolvedValue(undefined);
  const nativeUpdate = overrides.nativeUpdate ?? jest.fn().mockResolvedValue(undefined);

  const service = new UserService(
    { findOne: userFindOne, find: userFind } as never,
    { findOne: tokenFindOne, find: tokenFind } as never,
    { flush, findOne: emFindOne, execute: emExecute, persist, remove, nativeDelete, nativeUpdate } as never,
  );

  return {
    service,
    userFindOne,
    userFind,
    tokenFindOne,
    tokenFind,
    flush,
    emFindOne,
    emExecute,
    persist,
    remove,
    nativeDelete,
    nativeUpdate,
  };
}

describe('UserService – createUser', () => {
  it('vytvoří uživatele a account', async () => {
    const userFindOne = jest.fn().mockResolvedValue(null);
    const persist = jest.fn();
    const flush = jest.fn().mockResolvedValue(undefined);
    const { service } = makeService({ userFindOne, persist, flush });

    const result = await service.createUser({ email: 'NEW@Example.com', password: 'heslo', role: UserRole.USER });

    expect(result.email).toBe('new@example.com');
    expect(hashPassword).toHaveBeenCalledWith('heslo');
    expect(persist).toHaveBeenCalledTimes(2);
  });

  it('normalizuje email na lowercase', async () => {
    const { service, userFindOne } = makeService({ userFindOne: jest.fn().mockResolvedValue(null) });
    userFindOne.mockResolvedValue(null);

    const result = await service.createUser({ email: 'TEST@DOMAIN.COM', password: 'pw' });

    expect(result.email).toBe('test@domain.com');
  });

  it('nastaví jméno z emailu před @', async () => {
    const { service } = makeService({ userFindOne: jest.fn().mockResolvedValue(null) });

    const result = await service.createUser({ email: 'jan.novak@firma.cz', password: 'pw' });

    expect(result.name).toBe('jan.novak');
  });

  it('vyhodí ConflictException pokud email již existuje', async () => {
    const { service } = makeService({ userFindOne: jest.fn().mockResolvedValue(makeUser()) });

    await expect(
      service.createUser({ email: 'test@example.com', password: 'pw' }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('UserService – updateUser', () => {
  it('aktualizuje email', async () => {
    const user = makeUser();
    const userFindOne = jest.fn().mockResolvedValueOnce(user).mockResolvedValueOnce(null);
    const { service } = makeService({ userFindOne });

    const result = await service.updateUser('user-1', { email: 'novy@email.cz' });

    expect(result.email).toBe('novy@email.cz');
  });

  it('aktualizuje heslo přes account', async () => {
    const user = makeUser();
    const account = { password: 'stare-heslo' };
    const userFindOne = jest.fn().mockResolvedValue(user);
    const emFindOne = jest.fn().mockResolvedValue(account);
    const { service } = makeService({ userFindOne, emFindOne });

    await service.updateUser('user-1', { password: 'nove-heslo' });

    expect(hashPassword).toHaveBeenCalledWith('nove-heslo');
    expect(account.password).toBe('hashed-pw');
  });

  it('aktualizuje roli', async () => {
    const user = makeUser({ role: UserRole.USER });
    const { service } = makeService({ userFindOne: jest.fn().mockResolvedValue(user) });

    const result = await service.updateUser('user-1', { role: UserRole.ADMIN });

    expect(result.role).toBe(UserRole.ADMIN);
  });

  it('vyhodí NotFoundException pro neexistujícího uživatele', async () => {
    const { service } = makeService({ userFindOne: jest.fn().mockResolvedValue(null) });

    await expect(service.updateUser('neexistuje', {})).rejects.toThrow(NotFoundException);
  });

  it('vyhodí ConflictException pokud nový email patří jinému uživateli', async () => {
    const user = makeUser({ id: 'user-1' });
    const conflict = makeUser({ id: 'user-2', email: 'obsazeny@email.cz' });
    const userFindOne = jest.fn().mockResolvedValueOnce(user).mockResolvedValueOnce(conflict);
    const { service } = makeService({ userFindOne });

    await expect(
      service.updateUser('user-1', { email: 'obsazeny@email.cz' }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('UserService – getTokens', () => {
  it('vrátí seznam tokenů', async () => {
    const token = makeToken({ resetAt: new Date('2099-01-01T00:00:00Z') });
    const { service } = makeService({
      userFindOne: jest.fn().mockResolvedValue(makeUser()),
      tokenFind: jest.fn().mockResolvedValue([token]),
    });

    const result = await service.getTokens('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].dollarLimit).toBe(10);
    expect(result[0].usedDollars).toBe(2);
  });

  it('resetuje usedDollars pokud resetAt je v minulosti', async () => {
    const pastDate = new Date('2020-01-01T00:00:00Z');
    const token = makeToken({ resetAt: pastDate, usedDollars: 5 });
    const flush = jest.fn().mockResolvedValue(undefined);
    const { service } = makeService({
      userFindOne: jest.fn().mockResolvedValue(makeUser()),
      tokenFind: jest.fn().mockResolvedValue([token]),
      flush,
    });

    const result = await service.getTokens('user-1');

    expect(token.usedDollars).toBe(0);
    expect(flush).toHaveBeenCalled();
    expect(result[0].usedDollars).toBe(0);
  });

  it('vyhodí NotFoundException pro neexistujícího uživatele', async () => {
    const { service } = makeService({ userFindOne: jest.fn().mockResolvedValue(null) });

    await expect(service.getTokens('neexistuje')).rejects.toThrow(NotFoundException);
  });
});

describe('UserService – createToken', () => {
  it('vytvoří token pro uživatele', async () => {
    const persist = jest.fn();
    const flush = jest.fn().mockResolvedValue(undefined);
    const { service } = makeService({
      userFindOne: jest.fn().mockResolvedValue(makeUser()),
      tokenFindOne: jest.fn().mockResolvedValue(null),
      persist,
      flush,
    });

    const result = await service.createToken('user-1', { dollarLimit: 20 });

    expect(result.dollarLimit).toBe(20);
    expect(persist).toHaveBeenCalled();
  });

  it('vyhodí ConflictException pokud token již existuje', async () => {
    const { service } = makeService({
      userFindOne: jest.fn().mockResolvedValue(makeUser()),
      tokenFindOne: jest.fn().mockResolvedValue(makeToken()),
    });

    await expect(service.createToken('user-1', {})).rejects.toThrow(ConflictException);
  });

  it('vyhodí NotFoundException pro neexistujícího uživatele', async () => {
    const { service } = makeService({ userFindOne: jest.fn().mockResolvedValue(null) });

    await expect(service.createToken('neexistuje', {})).rejects.toThrow(NotFoundException);
  });
});

describe('UserService – updateToken', () => {
  it('aktualizuje dollarLimit', async () => {
    const token = makeToken({ dollarLimit: 10 });
    const { service } = makeService({ tokenFindOne: jest.fn().mockResolvedValue(token) });

    const result = await service.updateToken('user-1', 'token-1', { dollarLimit: 50 });

    expect(result.dollarLimit).toBe(50);
  });

  it('nastaví dollarLimit na null', async () => {
    const token = makeToken({ dollarLimit: 10 });
    const { service } = makeService({ tokenFindOne: jest.fn().mockResolvedValue(token) });

    const result = await service.updateToken('user-1', 'token-1', { dollarLimit: null });

    expect(result.dollarLimit).toBeNull();
  });

  it('vyhodí NotFoundException pro neexistující token', async () => {
    const { service } = makeService({ tokenFindOne: jest.fn().mockResolvedValue(null) });

    await expect(service.updateToken('user-1', 'neexistuje', {})).rejects.toThrow(NotFoundException);
  });
});

describe('UserService – deleteToken', () => {
  it('odstraní token', async () => {
    const token = makeToken();
    const remove = jest.fn();
    const flush = jest.fn().mockResolvedValue(undefined);
    const { service } = makeService({
      tokenFindOne: jest.fn().mockResolvedValue(token),
      remove,
      flush,
    });

    await service.deleteToken('user-1', 'token-1');

    expect(remove).toHaveBeenCalledWith(token);
    expect(flush).toHaveBeenCalled();
  });

  it('vyhodí NotFoundException pro neexistující token', async () => {
    const { service } = makeService({ tokenFindOne: jest.fn().mockResolvedValue(null) });

    await expect(service.deleteToken('user-1', 'neexistuje')).rejects.toThrow(NotFoundException);
  });
});

describe('UserService – deleteUser', () => {
  it('smaže uživatele a kaskádou smaže vazby', async () => {
    const user = makeUser();
    const flush = jest.fn().mockResolvedValue(undefined);
    const nativeDelete = jest.fn().mockResolvedValue(undefined);
    const nativeUpdate = jest.fn().mockResolvedValue(undefined);
    const { service } = makeService({
      userFindOne: jest.fn().mockResolvedValue(user),
      flush,
      nativeDelete,
      nativeUpdate,
    });

    await service.deleteUser('user-1', 'admin-user');

    expect(nativeDelete).toHaveBeenCalledTimes(3);
    expect(user.deletedAt).toBeInstanceOf(Date);
    expect(flush).toHaveBeenCalled();
  });

  it('soft-deletuje chaty uživatele', async () => {
    const user = makeUser();
    const nativeUpdate = jest.fn().mockResolvedValue(undefined);
    const { service } = makeService({
      userFindOne: jest.fn().mockResolvedValue(user),
      nativeUpdate,
    });

    await service.deleteUser('user-1', 'admin-user');

    expect(nativeUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { user: 'user-1', deletedAt: null },
      expect.objectContaining({ deletedAt: expect.any(Date) }),
    );
  });

  it('vyhodí ForbiddenException při pokusu smazat vlastní účet', async () => {
    const { service } = makeService();

    await expect(service.deleteUser('user-1', 'user-1')).rejects.toThrow(ForbiddenException);
  });

  it('vyhodí NotFoundException pro neexistujícího uživatele', async () => {
    const { service } = makeService({ userFindOne: jest.fn().mockResolvedValue(null) });

    await expect(service.deleteUser('neexistuje', 'admin-user')).rejects.toThrow(NotFoundException);
  });
});
