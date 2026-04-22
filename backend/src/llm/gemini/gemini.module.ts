import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { GeminiController } from './gemini.controller';
import { GeminiService } from './gemini.service';
import { User } from '../../entities/User';
import { LimitGuard } from '../limit.guard';

@Module({
  imports: [MikroOrmModule.forFeature([User])],
  controllers: [GeminiController],
  providers: [GeminiService, LimitGuard],
  exports: [GeminiService],
})
export class GeminiModule {}
