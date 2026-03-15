import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
