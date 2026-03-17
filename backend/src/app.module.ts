import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/postgresql';
import { getAuth } from './auth';

function isOpenApiExportMode(): boolean {
  const explicitFlag = process.env.OPENAPI_EXPORT;

  if (explicitFlag === undefined) {
    return false;
  }

  const normalizedFlag = explicitFlag.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalizedFlag);
}

const databaseImport = isOpenApiExportMode()
  ? []
  : [
      MikroOrmModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService) =>
          defineConfig({
            entities: ['./dist/entities'],
            entitiesTs: ['./src/entities'],
            dbName: config.get<string>('MIKRO_ORM_DB_NAME'),
            host: config.get<string>('MIKRO_ORM_HOST'),
            password: config.get<string>('MIKRO_ORM_PASSWORD'),
            port: Number(config.get<string>('MIKRO_ORM_PORT') ?? 5432),
            user: config.get<string>('MIKRO_ORM_USER'),
          }),
      }),
    ];

const authImport = isOpenApiExportMode()
  ? []
  : [
      AuthModule.forRootAsync({
        inject: [ConfigService, MikroORM],
        useFactory: (config: ConfigService, orm: MikroORM) => ({
          auth: getAuth(
            {
              ...process.env,
              BETTER_AUTH_SECRET: config.get<string>('BETTER_AUTH_SECRET'),
              BETTER_AUTH_URL: config.get<string>('BETTER_AUTH_URL'),
              FRONTEND_ORIGIN: config.get<string>('FRONTEND_ORIGIN'),
              HOST: config.get<string>('HOST'),
              PORT: config.get<string>('PORT'),
              MIKRO_ORM_HOST: config.get<string>('MIKRO_ORM_HOST'),
              MIKRO_ORM_PORT: config.get<string>('MIKRO_ORM_PORT'),
              MIKRO_ORM_DB_NAME: config.get<string>('MIKRO_ORM_DB_NAME'),
              MIKRO_ORM_USER: config.get<string>('MIKRO_ORM_USER'),
              MIKRO_ORM_PASSWORD: config.get<string>('MIKRO_ORM_PASSWORD'),
              NODE_ENV: config.get<string>('NODE_ENV') ?? process.env.NODE_ENV,
            },
            orm,
          ),
          disableGlobalAuthGuard: true,
        }),
      }),
    ];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ...databaseImport,
    ...authImport,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
