import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from '../mikro-orm.config';
import { betterAuth } from 'better-auth';
import { mikroOrmAdapter } from 'better-auth-mikro-orm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MikroOrmModule.forRoot({
      ...mikroOrmConfig,
    }),
    AuthModule.forRootAsync({
      inject: [MikroORM, ConfigService],
      useFactory: (orm: MikroORM, config: ConfigService) => ({
        auth: betterAuth({
          database: mikroOrmAdapter(orm),
          baseURL: config.getOrThrow<string>('BETTER_AUTH_URL'),
          secret: config.getOrThrow<string>('BETTER_AUTH_SECRET'),
          trustedOrigins: [config.getOrThrow<string>('FRONTEND_ORIGIN')],
          advanced: { database: { generateId: false } },
          emailAndPassword: { enabled: true },
        }),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
