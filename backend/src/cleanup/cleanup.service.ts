import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/postgresql';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly em: EntityManager) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async hardDeleteOldData(): Promise<void> {
    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() - 30);

    const cutoff90 = new Date();
    cutoff90.setDate(cutoff90.getDate() - 90);

    const chatResult = await this.em.execute(
      `DELETE FROM chat WHERE deleted_at IS NOT NULL AND deleted_at < $1`,
      [cutoff30],
    );
    const chatCount = (chatResult as any).rowCount ?? 0;
    if (chatCount > 0) {
      this.logger.log(`Hard deleted ${chatCount} chats older than 30 days`);
    }

    const userResult = await this.em.execute(
      `DELETE FROM "user" WHERE deleted_at IS NOT NULL AND deleted_at < $1`,
      [cutoff30],
    );
    const userCount = (userResult as any).rowCount ?? 0;
    if (userCount > 0) {
      this.logger.log(`Hard deleted ${userCount} users older than 30 days`);
    }

    const logResult = await this.em.execute(
      `DELETE FROM usage_log WHERE created_at < $1`,
      [cutoff90],
    );
    const logCount = (logResult as any).rowCount ?? 0;
    if (logCount > 0) {
      this.logger.log(`Hard deleted ${logCount} usage logs older than 90 days`);
    }
  }
}
