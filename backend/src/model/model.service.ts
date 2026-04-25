import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Model } from '../entities/Model';

@Injectable()
export class ModelService {
  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: EntityRepository<Model>,
  ) {}

  async getEnabledModels(): Promise<Model[]> {
    return this.modelRepository.find(
      { deletedAt: null, isEnabled: true },
      { orderBy: { createdAt: 'ASC' } },
    );
  }
}
