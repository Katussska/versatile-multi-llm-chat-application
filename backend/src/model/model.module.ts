import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Model } from '../entities/Model';
import { ModelController } from './model.controller';
import { ModelService } from './model.service';

@Module({
  imports: [MikroOrmModule.forFeature([Model])],
  controllers: [ModelController],
  providers: [ModelService],
  exports: [ModelService],
})
export class ModelModule {}
