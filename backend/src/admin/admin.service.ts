import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { User } from '../entities/User';
import { AdminUserDto } from './dto/admin-user.dto';
import { StatsResponseDto } from '../user/dto/stats-response.dto';
import { UserRole } from '../entities/UserRole';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async getUsers(): Promise<AdminUserDto[]> {
    const [rows, tokenRows] = await Promise.all([
      this.em.execute<
        {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          created_at: Date;
        }[]
      >(
        `SELECT id, email, name, role, created_at
         FROM "user"
         WHERE deleted_at IS NULL
         ORDER BY created_at ASC`,
      ),
      this.em.execute<
        {
          user_id: string;
          model_name: string;
          provider: string;
          token_count: number | null;
          used_tokens: number;
        }[]
      >(
        `SELECT t.user_id, m.name AS model_name, m.provider, t.token_count,
                CASE WHEN t.reset_at > NOW() THEN t.used_tokens ELSE 0 END AS used_tokens
         FROM token t
         JOIN model m ON t.model_id = m.id
         WHERE t.deleted_at IS NULL`,
      ),
    ]);

    const tokensByUser = new Map<string, typeof tokenRows>();
    for (const tr of tokenRows) {
      if (!tokensByUser.has(tr.user_id)) tokensByUser.set(tr.user_id, []);
      tokensByUser.get(tr.user_id)!.push(tr);
    }

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      createdAt: r.created_at,
      tokenLimits: (tokensByUser.get(r.id) ?? []).map((tl) => ({
        modelName: tl.model_name,
        provider: tl.provider,
        tokenCount: tl.token_count,
        usedTokens: tl.used_tokens,
      })),
    }));
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

    const dailyMap = new Map<string, number>(
      rows.map((r) => [r.date, parseInt(r.messages, 10)]),
    );
    const dailyActivity = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const date = d.toISOString().split('T')[0];
      return { date, messages: dailyMap.get(date) ?? 0 };
    });

    return { totalUsers, activeUsers, mostUsedModel, dailyActivity };
  }
}
