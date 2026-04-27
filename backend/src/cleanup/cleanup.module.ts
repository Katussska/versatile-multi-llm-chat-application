import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CleanupService } from './cleanup.service';

@Module({
  imports: [MikroOrmModule.forFeature([])],
  providers: [CleanupService],
})
export class CleanupModule {}
