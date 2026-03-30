import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { User } from './entities/User';

@Injectable()
export class AppService {
  constructor(private readonly em: EntityManager) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDbProbe() {
    const newestUser = await this.em.find(
      User,
      {},
      {
        limit: 1,
        orderBy: { createdAt: 'desc' },
      },
    );

    return {
      ok: true,
      usersCount: await this.em.count(User, {}),
      sampleUser: newestUser[0]
        ? {
            id: newestUser[0].id,
            email: newestUser[0].email,
            createdAt: newestUser[0].createdAt,
          }
        : null,
      checkedAt: new Date().toISOString(),
    };
  }
}
