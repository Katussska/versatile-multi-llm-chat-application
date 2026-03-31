import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { User } from './entities/User';

@Injectable()
export class AppService {
  constructor(private readonly em: EntityManager) {}

  getHello(): string {
    return 'Hello World!';
  }
}
