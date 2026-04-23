import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import type { Request } from 'express';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { User } from '../entities/User';

@Injectable()
export class LimitGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { session?: UserSession }>();
    const userId = request.session?.user.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.userRepository.findOne({
      id: userId,
      deletedAt: null,
    });
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const rows = await this.em.execute<{ spending_usd: string }[]>(
      `SELECT COALESCE(SUM(m.cost_usd), 0)::text AS spending_usd
       FROM message m
       JOIN chat c ON c.id = m.chat_id
       WHERE c.user_id = ?
         AND m.path = 'model'
         AND c.deleted_at IS NULL
         AND m.deleted_at IS NULL
         AND m.created_at >= date_trunc('month', NOW())
         AND m.created_at < (date_trunc('month', NOW()) + interval '1 month')`,
      [userId],
    );
    const currentSpending = parseFloat(rows[0]?.spending_usd ?? '0');

    if (currentSpending >= user.monthlyDollarLimit) {
      throw new HttpException(
        {
          message: 'Monthly dollar limit exceeded',
          monthlyDollarLimit: user.monthlyDollarLimit,
          currentSpending,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
