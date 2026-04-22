import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  async getUsers(): Promise<User[]> {
    return this.userRepository.find(
      { deletedAt: null },
      { orderBy: { createdAt: 'ASC' } },
    );
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({ email: dto.email.toLowerCase(), deletedAt: null });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const user = new User();
    user.email = dto.email.toLowerCase();
    user.name = dto.email.split('@')[0];
    user.emailVerified = true;
    user.admin = dto.admin ?? false;

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
      const conflict = await this.userRepository.findOne({ email: emailLower, deletedAt: null });
      if (conflict && conflict.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
      user.email = emailLower;
    }

    if (dto.admin !== undefined) {
      user.admin = dto.admin;
    }

    await this.em.flush();

    if (dto.password) {
      const account = await this.em.findOne(Account, { user: id, providerId: 'credential' });
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
    const user = await this.userRepository.findOne({ id: userId, deletedAt: null });
    if (!user) throw new NotFoundException('User not found');

    const tokens = await this.tokenRepository.find({ user: userId }, { populate: ['model'] });
    return tokens.map((t) => ({
      id: t.id,
      model: { id: t.model.id, name: t.model.name, provider: t.model.provider },
      tokenCount: t.tokenCount,
      usedTokens: t.usedTokens,
      resetAt: t.resetAt,
    }));
  }

  async createToken(userId: string, dto: CreateTokenDto): Promise<TokenResponseDto> {
    const user = await this.userRepository.findOne({ id: userId, deletedAt: null });
    if (!user) throw new NotFoundException('User not found');

    const model = await this.modelRepository.findOne({ id: dto.modelId });
    if (!model) throw new NotFoundException('Model not found');

    const existing = await this.tokenRepository.findOne({ user: userId, model: dto.modelId });
    if (existing) throw new ConflictException('Token limit for this model already exists');

    const token = new Token();
    token.user = user;
    token.model = model;
    token.tokenCount = dto.tokenCount;
    token.resetAt = new Date(dto.resetAt);

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

  async updateToken(userId: string, tokenId: string, dto: UpdateTokenDto): Promise<TokenResponseDto> {
    const token = await this.tokenRepository.findOne({ id: tokenId, user: userId }, { populate: ['model'] });
    if (!token) throw new NotFoundException('Token limit not found');

    if (dto.tokenCount !== undefined) token.tokenCount = dto.tokenCount;
    if (dto.resetAt !== undefined) token.resetAt = new Date(dto.resetAt);

    await this.em.flush();

    return {
      id: token.id,
      model: { id: token.model.id, name: token.model.name, provider: token.model.provider },
      tokenCount: token.tokenCount,
      usedTokens: token.usedTokens,
      resetAt: token.resetAt,
    };
  }

  async deleteToken(userId: string, tokenId: string): Promise<void> {
    const token = await this.tokenRepository.findOne({ id: tokenId, user: userId });
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
