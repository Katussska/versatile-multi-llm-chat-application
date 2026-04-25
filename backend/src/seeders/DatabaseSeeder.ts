import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { TestingUserSeeder } from './TestingUserSeeder';
import { ModelSeeder } from './ModelSeeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.call(em, [TestingUserSeeder, ModelSeeder]);
  }
}
