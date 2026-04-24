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

    if (user.monthlyTokenLimit === null) {
      return true;
    }

    const rows = await this.em.execute<{ total_tokens: string }[]>(
      `SELECT COALESCE(SUM(COALESCE(ul.prompt_tokens, 0) + COALESCE(ul.completion_tokens, 0)), 0)::text AS total_tokens
       FROM usage_log ul
       WHERE ul.user_id = ?
         AND ul.created_at >= date_trunc('month', NOW())
         AND ul.created_at < (date_trunc('month', NOW()) + interval '1 month')`,
      [userId],
    );
    const usedTokens = parseInt(rows[0]?.total_tokens ?? '0', 10);

    if (usedTokens >= user.monthlyTokenLimit) {
      throw new HttpException(
        {
          message: 'Monthly token limit exceeded',
          monthlyTokenLimit: user.monthlyTokenLimit,
          usedTokens,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
