import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { User } from '../entities/User';
import { AdminUserDto } from './dto/admin-user.dto';
import { ChartDataPointDto } from './dto/chart-data.dto';
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
    const [rows, budgetRows] = await Promise.all([
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
          dollar_limit: number | null;
          used_dollars: number;
        }[]
      >(
        `SELECT t.user_id,
                COALESCE(m.name, t.provider) AS model_name,
                t.provider,
                t.dollar_limit,
                CASE WHEN t.reset_at > NOW() THEN t.used_dollars ELSE 0 END AS used_dollars
         FROM token t
         LEFT JOIN LATERAL (
           SELECT name
           FROM model m
           WHERE m.provider = t.provider
             AND m.deleted_at IS NULL
           ORDER BY m.name ASC, m.created_at ASC
           LIMIT 1
         ) m ON TRUE
         WHERE t.deleted_at IS NULL`,
      ),
    ]);

    const budgetsByUser = new Map<string, typeof budgetRows>();
    for (const tr of budgetRows) {
      if (!budgetsByUser.has(tr.user_id)) budgetsByUser.set(tr.user_id, []);
      budgetsByUser.get(tr.user_id)!.push(tr);
    }

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      createdAt: r.created_at,
      budgetLimits: (budgetsByUser.get(r.id) ?? []).map((tl) => ({
        modelName: tl.model_name,
        provider: tl.provider,
        dollarLimit: tl.dollar_limit,
        usedDollars: tl.used_dollars,
      })),
    }));
  }

  async getStats(from: string, to: string): Promise<StatsResponseDto> {
    const fromDate = new Date(from + 'T00:00:00Z');
    const toDate = new Date(to + 'T00:00:00Z');
    toDate.setUTCDate(toDate.getUTCDate() + 1);

    const totalUsers = await this.userRepository.count({ deletedAt: null });

    const [activeResult] = await this.em.execute<{ count: string }[]>(
      `SELECT COUNT(DISTINCT user_id)::text AS count FROM chat WHERE created_at >= ? AND created_at < ? AND deleted_at IS NULL`,
      [fromDate, toDate],
    );
    const activeUsers = parseInt(activeResult?.count ?? '0', 10);

    const [modelResult] = await this.em.execute<{ name: string }[]>(
      `SELECT m.name FROM chat c JOIN model m ON c.model_id = m.id WHERE c.deleted_at IS NULL AND c.created_at >= ? AND c.created_at < ? GROUP BY m.name ORDER BY COUNT(c.id) DESC LIMIT 1`,
      [fromDate, toDate],
    );
    const mostUsedModel = modelResult?.name ?? null;

    return { totalUsers, activeUsers, mostUsedModel };
  }

  async getChartData(
    from: string,
    to: string,
    provider?: string,
    model?: string,
    userId?: string,
  ): Promise<ChartDataPointDto[]> {
    const fromDate = new Date(from + 'T00:00:00Z');
    const toDate = new Date(to + 'T00:00:00Z');
    toDate.setUTCDate(toDate.getUTCDate() + 1);

    const conditions: string[] = ['ul.created_at >= ?', 'ul.created_at < ?'];
    const params: unknown[] = [fromDate, toDate];

    if (provider) {
      conditions.push('ul.model_provider = ?');
      params.push(provider);
    }
    if (model) {
      conditions.push('ul.model_name = ?');
      params.push(model);
    }
    if (userId) {
      conditions.push('ul.user_id = ?');
      params.push(userId);
    }

    const rows = await this.em.execute<
      {
        date: string;
        model_name: string;
        model_provider: string;
        tokens_in: string;
        tokens_out: string;
        tokens_cached: string;
        cost: string;
      }[]
    >(
      `SELECT
        TO_CHAR(ul.created_at, 'YYYY-MM-DD') AS date,
        COALESCE(ul.model_name, '') AS model_name,
        COALESCE(ul.model_provider, '') AS model_provider,
        SUM(COALESCE(ul.prompt_tokens, 0))::bigint AS tokens_in,
        SUM(COALESCE(ul.completion_tokens, 0))::bigint AS tokens_out,
        SUM(COALESCE(ul.cache_read_tokens, 0) + COALESCE(ul.cached_input_tokens, 0))::bigint AS tokens_cached,
        SUM(COALESCE(ul.cost, 0))::float AS cost
       FROM usage_log ul
       WHERE ${conditions.join(' AND ')}
       GROUP BY TO_CHAR(ul.created_at, 'YYYY-MM-DD'), ul.model_name, ul.model_provider
       ORDER BY date ASC`,
      params,
    );

    return rows.map((r) => ({
      date: r.date,
      modelName: r.model_name,
      modelProvider: r.model_provider,
      tokensIn: Number(r.tokens_in),
      tokensOut: Number(r.tokens_out),
      tokensCached: Number(r.tokens_cached),
      cost: Number(r.cost),
    }));
  }
}
