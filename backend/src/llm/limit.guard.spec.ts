import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

jest.mock('@mikro-orm/nestjs', () => ({
  InjectRepository: () => () => undefined,
}));
jest.mock('@mikro-orm/postgresql', () => ({}));
jest.mock('../entities/User', () => ({
  User: class MockUser {},
}));

const { LimitGuard } = require('./limit.guard') as {
  LimitGuard: new (
    userRepository: unknown,
    em: unknown,
  ) => { canActivate: (context: ExecutionContext) => Promise<boolean> };
};

describe('LimitGuard', () => {
  const findOne = jest.fn();
  const execute = jest.fn();

  const userRepository = {
    findOne,
  };
  const em = {
    execute,
  };

  const createContext = (session?: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ session }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws unauthorized when session user is missing', async () => {
    const guard = new LimitGuard(userRepository, em);

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      new UnauthorizedException('User not authenticated'),
    );
    expect(findOne).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('throws unauthorized when user is not found', async () => {
    findOne.mockResolvedValueOnce(null);
    const guard = new LimitGuard(userRepository, em);

    await expect(
      guard.canActivate(createContext({ user: { id: 'missing-user' } })),
    ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
    expect(findOne).toHaveBeenCalledWith({
      id: 'missing-user',
      deletedAt: null,
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('allows request when monthly token limit is null (unlimited)', async () => {
    findOne.mockResolvedValueOnce({ monthlyTokenLimit: null });
    const guard = new LimitGuard(userRepository, em);

    await expect(
      guard.canActivate(createContext({ user: { id: 'unlimited-user' } })),
    ).resolves.toBe(true);
    expect(execute).not.toHaveBeenCalled();
  });

  it('throws too many requests when monthly token limit is exceeded', async () => {
    findOne.mockResolvedValueOnce({ monthlyTokenLimit: 100000 });
    execute.mockResolvedValueOnce([{ total_tokens: '100001' }]);
    const guard = new LimitGuard(userRepository, em);

    await expect(
      guard.canActivate(createContext({ user: { id: 'user-over-limit' } })),
    ).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
      response: {
        message: 'Monthly token limit exceeded',
        monthlyTokenLimit: 100000,
        usedTokens: 100001,
      },
    });
  });

  it('allows request when used tokens are below monthly token limit', async () => {
    findOne.mockResolvedValueOnce({ monthlyTokenLimit: 100000 });
    execute.mockResolvedValueOnce([{ total_tokens: '99999' }]);
    const guard = new LimitGuard(userRepository, em);

    await expect(
      guard.canActivate(createContext({ user: { id: 'user-under-limit' } })),
    ).resolves.toBe(true);
  });
});
