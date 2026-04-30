import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '../entities/User';
import { Account } from '../entities/Account';
import { Session } from '../entities/Session';
import { Token } from '../entities/Token';

@Module({
  imports: [MikroOrmModule.forFeature([User, Account, Session, Token])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
