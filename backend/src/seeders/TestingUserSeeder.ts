import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { hashPassword } from 'better-auth/crypto';
import { Account } from '../entities/Account';
import { User } from '../entities/User';
import { UserRole } from '../entities/UserRole';

function getEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();

  return value && value.length > 0 ? value : fallback;
}

export class TestingUserSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const email = getEnv(
      'SEED_TEST_USER_EMAIL',
      'test@cognify.local',
    ).toLowerCase();
    const password = getEnv('SEED_TEST_USER_PASSWORD', 'Test123456!');
    const name = getEnv('SEED_TEST_USER_NAME', 'Cognify Test User');

    let user = await em.findOne(User, { email });

    if (!user) {
      user = new User();
      user.email = email;
      user.name = name;
      user.emailVerified = true;
      user.role = UserRole.ADMIN;
      em.persist(user);
      await em.flush();
    } else {
      user.name = name;
      user.emailVerified = true;
      await em.flush();
    }

    const passwordHash = await hashPassword(password);

    let account = await em.findOne(Account, {
      user: user.id,
      providerId: 'credential',
    });

    if (!account) {
      account = new Account();
      account.user = user;
      account.providerId = 'credential';
      account.accountId = user.id;
      account.password = passwordHash;
      em.persist(account);
    } else {
      account.accountId = user.id;
      account.password = passwordHash;
    }

    await em.flush();

    console.info(`Seeded testing user: ${email}`);
  }
}
