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

  async getUsers(): Promise<
    (User & {
      tokenLimits: {
        modelId: string;
        modelName: string;
        provider: string;
        tokenCount: number | null;
        usedTokens: number;
      }[];
    })[]
  > {
    const users = await this.userRepository.find(
      { deletedAt: null },
      { orderBy: { createdAt: 'ASC' } },
    );

    const [tokenRows, allModels] = await Promise.all([
      this.em.execute<
        {
          user_id: string;
          token_count: string | null;
          used_tokens: string;
          model_id: string;
          model_name: string;
          provider: string;
        }[]
      >(
        `SELECT t.user_id,
                t.token_count::text,
                CASE WHEN t.reset_at IS NULL OR t.reset_at > now() THEN t.used_tokens ELSE 0 END::text AS used_tokens,
                m.id AS model_id,
                m.name AS model_name,
                m.provider
         FROM token t
         JOIN model m ON t.model_id = m.id`,
      ),
      this.em.execute<{ id: string; name: string; provider: string }[]>(
        `SELECT id, name, provider FROM model ORDER BY name ASC`,
      ),
    ]);

    const tokenMap = new Map<
      string,
      {
        modelId: string;
        modelName: string;
        provider: string;
        tokenCount: number | null;
        usedTokens: number;
      }[]
    >();
    for (const r of tokenRows) {
      if (!tokenMap.has(r.user_id)) tokenMap.set(r.user_id, []);
      tokenMap.get(r.user_id)!.push({
        modelId: r.model_id,
        modelName: r.model_name,
        provider: r.provider,
        tokenCount: r.token_count != null ? parseInt(r.token_count, 10) : null,
        usedTokens: parseInt(r.used_tokens, 10),
      });
    }

    return users.map((u) => {
      const existing = tokenMap.get(u.id) ?? [];
      const coveredIds = new Set(existing.map((t) => t.modelId));
      const tokenLimits = [
        ...existing,
        ...allModels
          .filter((m) => !coveredIds.has(m.id))
          .map((m) => ({
            modelId: m.id,
            modelName: m.name,
            provider: m.provider,
            tokenCount: null,
            usedTokens: 0,
          })),
      ];
      return Object.assign(u, {
        tokenLimits,
      });
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

    const tokens = await this.tokenRepository.find(
      { user: userId },
      { populate: ['model'] },
    );

    const now = new Date();
    let dirty = false;
    for (const t of tokens) {
      if (t.resetAt.getUTCFullYear() >= 9999 || now >= t.resetAt) {
        if (now >= t.resetAt) t.usedTokens = 0;
        t.resetAt = nextMonthFirstDay();
        dirty = true;
      }
    }
    if (dirty) await this.em.flush();

    return tokens.map((t) => ({
      id: t.id,
      model: { id: t.model.id, name: t.model.name, provider: t.model.provider },
      tokenCount: t.tokenCount,
      usedTokens: t.usedTokens,
      resetAt: t.resetAt,
    }));
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

    const model = await this.modelRepository.findOne({ id: dto.modelId });
    if (!model) throw new NotFoundException('Model not found');

    const existing = await this.tokenRepository.findOne({
      user: userId,
      model: dto.modelId,
    });
    if (existing)
      throw new ConflictException('Token limit for this model already exists');

    const token = new Token();
    token.user = user;
    token.model = model;
    token.tokenCount = dto.tokenCount ?? null;
    token.resetAt = nextMonthFirstDay();

    this.em.persist(token);
    await this.em.flush();

    return {
      id: token.id,
      model: { id: model.id, name: model.name, provider: model.provider },
      tokenCount: token.tokenCount,
      usedTokens: token.usedTokens,
      resetAt: token.resetAt,
    };
  }

  async updateToken(
    userId: string,
    tokenId: string,
    dto: UpdateTokenDto,
  ): Promise<TokenResponseDto> {
    const token = await this.tokenRepository.findOne(
      { id: tokenId, user: userId },
      { populate: ['model'] },
    );
    if (!token) throw new NotFoundException('Token limit not found');

    if (dto.tokenCount !== undefined) token.tokenCount = dto.tokenCount ?? null;

    await this.em.flush();

    return {
      id: token.id,
      model: {
        id: token.model.id,
        name: token.model.name,
        provider: token.model.provider,
      },
      tokenCount: token.tokenCount,
      usedTokens: token.usedTokens,
      resetAt: token.resetAt,
    };
  }

  async deleteToken(userId: string, tokenId: string): Promise<void> {
    const token = await this.tokenRepository.findOne({
      id: tokenId,
      user: userId,
    });
    if (!token) throw new NotFoundException('Token limit not found');

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
