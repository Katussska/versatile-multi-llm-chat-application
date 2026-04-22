import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { User } from '../entities/User';
import { AdminUserDto } from './dto/admin-user.dto';
import { UpdateLimitDto } from './dto/update-limit.dto';
import { StatsResponseDto } from '../user/dto/stats-response.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async getUsers(): Promise<AdminUserDto[]> {
    const rows = await this.em.execute<
      { id: string; email: string; name: string; admin: boolean; created_at: Date; dollar_limit: number | null }[]
    >(
      `SELECT id, email, name, admin, created_at, dollar_limit
       FROM "user"
       WHERE deleted_at IS NULL
       ORDER BY created_at ASC`,
    );

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      admin: r.admin,
      createdAt: r.created_at,
      dollarLimit: r.dollar_limit,
    }));
  }

  async updateLimit(userId: string, dto: UpdateLimitDto): Promise<AdminUserDto> {
    const user = await this.userRepository.findOne({ id: userId, deletedAt: null });
    if (!user) throw new NotFoundException('User not found');

    user.dollarLimit = dto.dollarLimit ?? null;
    await this.em.flush();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      admin: user.admin,
      createdAt: user.createdAt,
      dollarLimit: user.dollarLimit,
    };
  }

  async getStats(days: number): Promise<StatsResponseDto> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const totalUsers = await this.userRepository.count({ deletedAt: null });

    const [activeResult] = await this.em.execute<{ count: string }[]>(
      `SELECT COUNT(DISTINCT user_id)::text AS count FROM chat WHERE created_at >= ? AND deleted_at IS NULL`,
      [since],
    );
    const activeUsers = parseInt(activeResult?.count ?? '0', 10);

    const [modelResult] = await this.em.execute<{ name: string }[]>(
      `SELECT m.name FROM chat c JOIN model m ON c.model_id = m.id WHERE c.deleted_at IS NULL AND c.created_at >= ? GROUP BY m.name ORDER BY COUNT(c.id) DESC LIMIT 1`,
      [since],
    );
    const mostUsedModel = modelResult?.name ?? null;

    const rows = await this.em.execute<{ date: string; messages: string }[]>(
      `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::text AS messages FROM message WHERE created_at >= ? AND deleted_at IS NULL GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') ORDER BY date ASC`,
      [since],
    );

    const dailyMap = new Map<string, number>(rows.map((r) => [r.date, parseInt(r.messages, 10)]));
    const dailyActivity = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const date = d.toISOString().split('T')[0];
      return { date, messages: dailyMap.get(date) ?? 0 };
    });

    return { totalUsers, activeUsers, mostUsedModel, dailyActivity };
  }
}
