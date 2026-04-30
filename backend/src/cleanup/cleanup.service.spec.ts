jest.mock('@mikro-orm/postgresql', () => ({}));
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_DAY_AT_MIDNIGHT: '0 0 * * *' },
}));

import { CleanupService } from './cleanup.service';

describe('CleanupService – hardDeleteOldData', () => {
  let service: CleanupService;
  let execute: jest.Mock;

  beforeEach(() => {
    execute = jest.fn().mockResolvedValue({ rowCount: 0 });
    service = new CleanupService({ execute } as never);
  });

  it('maže chaty soft-deletované před více než 30 dny', async () => {
    await service.hardDeleteOldData();

    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM chat'),
      expect.arrayContaining([expect.any(Date)]),
    );
  });

  it('maže uživatele soft-deletované před více než 30 dny', async () => {
    await service.hardDeleteOldData();

    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM "user"'),
      expect.arrayContaining([expect.any(Date)]),
    );
  });

  it('maže usage logy starší než 90 dnů', async () => {
    await service.hardDeleteOldData();

    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM usage_log'),
      expect.arrayContaining([expect.any(Date)]),
    );
  });

  it('cutoff pro chaty a uživatele je přibližně 30 dní nazpátek', async () => {
    const before = new Date();
    await service.hardDeleteOldData();
    const after = new Date();

    const chatCutoff = execute.mock.calls[0][1][0] as Date;

    const expectedMin = new Date(before);
    expectedMin.setDate(expectedMin.getDate() - 30);
    const expectedMax = new Date(after);
    expectedMax.setDate(expectedMax.getDate() - 30);

    expect(chatCutoff.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
    expect(chatCutoff.getTime()).toBeLessThanOrEqual(
      expectedMax.getTime() + 1000,
    );
  });

  it('cutoff pro usage logy je přibližně 90 dní nazpátek', async () => {
    const before = new Date();
    await service.hardDeleteOldData();
    const after = new Date();

    const logCutoff = execute.mock.calls[2][1][0] as Date;

    const expectedMin = new Date(before);
    expectedMin.setDate(expectedMin.getDate() - 90);
    const expectedMax = new Date(after);
    expectedMax.setDate(expectedMax.getDate() - 90);

    expect(logCutoff.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
    expect(logCutoff.getTime()).toBeLessThanOrEqual(
      expectedMax.getTime() + 1000,
    );
  });

  it('projde bez chyby pokud nejsou žádné záznamy ke smazání (rowCount = 0)', async () => {
    execute.mockResolvedValue({ rowCount: 0 });

    await expect(service.hardDeleteOldData()).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledTimes(3);
  });
});
