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

  it('allows request for users with unlimited monthly limit', async () => {
    findOne.mockResolvedValueOnce({ monthlyLimit: null });
    const guard = new LimitGuard(userRepository, em);

    await expect(
      guard.canActivate(createContext({ user: { id: 'user-unlimited' } })),
    ).resolves.toBe(true);
    expect(execute).not.toHaveBeenCalled();
  });

  it('throws payment required when monthly limit is exceeded', async () => {
    findOne.mockResolvedValueOnce({ monthlyLimit: 10 });
    execute.mockResolvedValueOnce([{ spending_usd: '10.01' }]);
    const guard = new LimitGuard(userRepository, em);

    await expect(
      guard.canActivate(createContext({ user: { id: 'user-over-limit' } })),
    ).rejects.toMatchObject({
      status: HttpStatus.PAYMENT_REQUIRED,
      response: {
        message: 'Monthly dollar limit exceeded',
        monthlyLimit: 10,
        currentSpending: 10.01,
      },
    });
  });

  it('allows request when current spending is below monthly limit', async () => {
    findOne.mockResolvedValueOnce({ monthlyLimit: 10 });
    execute.mockResolvedValueOnce([{ spending_usd: '9.99' }]);
    const guard = new LimitGuard(userRepository, em);

    await expect(
      guard.canActivate(createContext({ user: { id: 'user-under-limit' } })),
    ).resolves.toBe(true);
  });
});
