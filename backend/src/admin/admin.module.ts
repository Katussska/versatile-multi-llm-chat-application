import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/User';

@Module({
  imports: [MikroOrmModule.forFeature([User])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
