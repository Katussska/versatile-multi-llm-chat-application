import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { hashPassword } from 'better-auth/crypto';
import { User } from '../entities/User';
import { Account } from '../entities/Account';
import { Session } from '../entities/Session';
import { Token } from '../entities/Token';
import { Model } from '../entities/Model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { nextMonthFirstDay } from '../date.utils';
import { UserRole } from '../entities/UserRole';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(Token)
    private readonly tokenRepository: EntityRepository<Token>,
    @InjectRepository(Model)
    private readonly modelRepository: EntityRepository<Model>,
    private readonly em: EntityManager,
  ) {}

  private async getRepresentativeModelsByProvider(): Promise<
    Map<string, Model>
  > {
    const models = await this.modelRepository.find(
      { deletedAt: null },
      { orderBy: { name: 'ASC', createdAt: 'ASC' } },
    );

    const byProvider = new Map<string, Model>();
    for (const model of models) {
      if (!byProvider.has(model.provider)) {
        byProvider.set(model.provider, model);
      }
    }

    return byProvider;
  }

  async getUsers(): Promise<
    (User & {
      budgetLimits: {
        modelId: string;
        modelName: string;
        provider: string;
        dollarLimit: number | null;
        usedDollars: number;
      }[];
    })[]
  > {
    const users = await this.userRepository.find(
      { deletedAt: null },
      { orderBy: { createdAt: 'ASC' } },
    );

    const [budgetRows, allModels] = await Promise.all([
      this.em.execute<
        {
          user_id: string;
          dollar_limit: string | null;
          used_dollars: string;
          provider: string;
          model_id: string;
          model_name: string;
        }[]
      >(
        `SELECT t.user_id,
                t.dollar_limit::text,
                CASE WHEN t.reset_at IS NULL OR t.reset_at > now() THEN t.used_dollars ELSE 0 END::text AS used_dollars,
                t.provider,
                m.id AS model_id,
                m.name AS model_name
         FROM token t
         JOIN LATERAL (
           SELECT id, name
           FROM model m
           WHERE m.provider = t.provider
             AND m.deleted_at IS NULL
           ORDER BY m.name ASC, m.created_at ASC
           LIMIT 1
         ) m ON TRUE
         WHERE t.deleted_at IS NULL`,
      ),
      this.em.execute<{ id: string; name: string; provider: string }[]>(
        `SELECT DISTINCT ON (provider) id, name, provider
         FROM model
         WHERE deleted_at IS NULL
         ORDER BY provider, name ASC, created_at ASC`,
      ),
    ]);

    const budgetMap = new Map<
      string,
      {
        modelId: string;
        modelName: string;
        provider: string;
        dollarLimit: number | null;
        usedDollars: number;
      }[]
    >();
    for (const r of budgetRows) {
      if (!budgetMap.has(r.user_id)) budgetMap.set(r.user_id, []);
      budgetMap.get(r.user_id)!.push({
        modelId: r.model_id,
        modelName: r.model_name,
        provider: r.provider,
        dollarLimit: r.dollar_limit != null ? parseFloat(r.dollar_limit) : null,
        usedDollars: parseFloat(r.used_dollars),
      });
    }

    return users.map((u) => {
      const existing = budgetMap.get(u.id) ?? [];
      const coveredIds = new Set(existing.map((t) => t.modelId));
      const budgetLimits = [
        ...existing,
        ...allModels
          .filter((m) => !coveredIds.has(m.id))
          .map((m) => ({
            modelId: m.id,
            modelName: m.name,
            provider: m.provider,
            dollarLimit: null,
            usedDollars: 0,
          })),
      ];
      return Object.assign(u, { budgetLimits });
    });
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      email: dto.email.toLowerCase(),
      deletedAt: null,
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const user = new User();
    user.email = dto.email.toLowerCase();
    user.name = dto.email.split('@')[0];
    user.emailVerified = true;
    user.role = dto.role ?? UserRole.USER;

    this.em.persist(user);
    await this.em.flush();

    const passwordHash = await hashPassword(dto.password);

    const account = new Account();
    account.user = user;
    account.providerId = 'credential';
    account.accountId = user.id;
    account.password = passwordHash;

    this.em.persist(account);
    await this.em.flush();

    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ id, deletedAt: null });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email) {
      const emailLower = dto.email.toLowerCase();
      const conflict = await this.userRepository.findOne({
        email: emailLower,
        deletedAt: null,
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
      user.email = emailLower;
    }

    if (dto.role !== undefined) {
      user.role = dto.role;
    }

    await this.em.flush();

    if (dto.password) {
      const account = await this.em.findOne(Account, {
        user: id,
        providerId: 'credential',
      });
      if (account) {
        account.password = await hashPassword(dto.password);
        await this.em.flush();
      }
    }

    return user;
  }

  async getModels(): Promise<Model[]> {
    return this.modelRepository.findAll({ orderBy: { name: 'ASC' } });
  }

  async getTokens(userId: string): Promise<TokenResponseDto[]> {
    const user = await this.userRepository.findOne({
      id: userId,
      deletedAt: null,
    });
    if (!user) throw new NotFoundException('User not found');

    const tokens = await this.tokenRepository.find({ user: userId });
    const modelsByProvider = await this.getRepresentativeModelsByProvider();

    const now = new Date();
    let dirty = false;
    for (const t of tokens) {
      if (t.resetAt.getUTCFullYear() >= 9999 || now >= t.resetAt) {
        if (now >= t.resetAt) t.usedDollars = 0;
        t.resetAt = nextMonthFirstDay();
        dirty = true;
      }
    }
    if (dirty) await this.em.flush();

    return tokens.map((t) => {
      const model = modelsByProvider.get(t.provider);
      if (!model) {
        throw new NotFoundException(
          `Model for provider ${t.provider} not found`,
        );
      }

      return {
        id: t.id,
        model: { id: model.id, name: model.name, provider: model.provider },
        dollarLimit: t.dollarLimit,
        usedDollars: t.usedDollars,
        resetAt: t.resetAt,
      };
    });
  }

  async createToken(
    userId: string,
    dto: CreateTokenDto,
  ): Promise<TokenResponseDto> {
    const user = await this.userRepository.findOne({
      id: userId,
      deletedAt: null,
    });
    if (!user) throw new NotFoundException('User not found');

    const model = await this.modelRepository.findOne(
      { provider: dto.provider, deletedAt: null },
      { orderBy: { name: 'ASC', createdAt: 'ASC' } },
    );
    if (!model) throw new NotFoundException('Provider not found');

    const existing = await this.tokenRepository.findOne({
      user: userId,
      provider: model.provider,
    });
    if (existing)
      throw new ConflictException(
        'Budget limit for this provider already exists',
      );

    const token = new Token();
    token.user = user;
    token.provider = model.provider;
    token.dollarLimit = dto.dollarLimit ?? null;
    token.resetAt = nextMonthFirstDay();

    this.em.persist(token);
    await this.em.flush();

    return {
      id: token.id,
      model: { id: model.id, name: model.name, provider: model.provider },
      dollarLimit: token.dollarLimit,
      usedDollars: token.usedDollars,
      resetAt: token.resetAt,
    };
  }

  async updateToken(
    userId: string,
    tokenId: string,
    dto: UpdateTokenDto,
  ): Promise<TokenResponseDto> {
    const token = await this.tokenRepository.findOne({
      id: tokenId,
      user: userId,
    });
    if (!token) throw new NotFoundException('Budget limit not found');

    const model = await this.modelRepository.findOne(
      { provider: token.provider, deletedAt: null },
      { orderBy: { name: 'ASC', createdAt: 'ASC' } },
    );
    if (!model) {
      throw new NotFoundException(
        `Model for provider ${token.provider} not found`,
      );
    }

    if (dto.dollarLimit !== undefined)
      token.dollarLimit = dto.dollarLimit ?? null;

    await this.em.flush();

    return {
      id: token.id,
      model: {
        id: model.id,
        name: model.name,
        provider: model.provider,
      },
      dollarLimit: token.dollarLimit,
      usedDollars: token.usedDollars,
      resetAt: token.resetAt,
    };
  }

  async deleteToken(userId: string, tokenId: string): Promise<void> {
    const token = await this.tokenRepository.findOne({
      id: tokenId,
      user: userId,
    });
    if (!token) throw new NotFoundException('Budget limit not found');

    this.em.remove(token);
    await this.em.flush();
  }

  async deleteUser(id: string, requestingUserId: string): Promise<void> {
    if (id === requestingUserId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const user = await this.userRepository.findOne({ id, deletedAt: null });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.em.nativeDelete(Session, { user: id });
    await this.em.nativeDelete(Account, { user: id });
    await this.em.nativeDelete(Token, { user: id });

    user.deletedAt = new Date();
    await this.em.flush();
  }
}
