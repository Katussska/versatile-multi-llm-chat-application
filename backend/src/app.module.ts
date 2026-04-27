import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from '../mikro-orm.config';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { GeminiModule } from './llm/gemini/gemini.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { ModelModule } from './model/model.module';
import { CleanupModule } from './cleanup/cleanup.module';
import { UserRole } from './entities/UserRole';

function getTrustedOrigins(config: ConfigService): string[] {
  const fallbackOrigin = config.get<string>('BETTER_AUTH_URL');
  const configuredOrigins = config.get<string>('FRONTEND_ORIGIN');
  const rawOrigins =
    configuredOrigins ?? fallbackOrigin ?? 'http://localhost:5173';

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MikroOrmModule.forRoot({
      ...mikroOrmConfig,
    }),
    AuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const pool = new Pool({
          host: config.getOrThrow<string>('MIKRO_ORM_HOST'),
          port: Number(config.getOrThrow<string>('MIKRO_ORM_PORT')),
          user: config.getOrThrow<string>('MIKRO_ORM_USER'),
          password: config.getOrThrow<string>('MIKRO_ORM_PASSWORD'),
          database: config.getOrThrow<string>('MIKRO_ORM_DB_NAME'),
          options: '-c search_path=public',
        });

        return {
          auth: betterAuth({
            database: pool,
            baseURL: config.getOrThrow<string>('BETTER_AUTH_URL'),
            secret: config.getOrThrow<string>('BETTER_AUTH_SECRET'),
            trustedOrigins: getTrustedOrigins(config),
            advanced: { database: { generateId: false } },
            emailAndPassword: { enabled: true },
            user: {
              additionalFields: {
                role: {
                  type: 'string',
                  defaultValue: UserRole.USER,
                  input: false,
                },
              },
              fields: {
                emailVerified: 'email_verified',
                createdAt: 'created_at',
                updatedAt: 'updated_at',
              },
            },
            session: {
              fields: {
                userId: 'user_id',
                expiresAt: 'expires_at',
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                ipAddress: 'ip_address',
                userAgent: 'user_agent',
              },
            },
            account: {
              fields: {
                userId: 'user_id',
                accountId: 'account_id',
                providerId: 'provider_id',
                accessToken: 'access_token',
                refreshToken: 'refresh_token',
                idToken: 'id_token',
                accessTokenExpiresAt: 'access_token_expires_at',
                refreshTokenExpiresAt: 'refresh_token_expires_at',
                createdAt: 'created_at',
                updatedAt: 'updated_at',
              },
            },
            verification: {
              fields: {
                expiresAt: 'expires_at',
                createdAt: 'created_at',
                updatedAt: 'updated_at',
              },
            },
          }),
        };
      },
    }),
    GeminiModule,
    ChatModule,
    UserModule,
    AdminModule,
    ModelModule,
    CleanupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
