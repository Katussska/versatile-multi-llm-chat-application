import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      useFactory: () =>
        defineConfig({
          entities: ['./dist/entities'],
          entitiesTs: ['./src/entities'],
          dbName: process.env.MIKRO_ORM_DB_NAME,
          host: process.env.MIKRO_ORM_HOST,
          password: process.env.MIKRO_ORM_PASSWORD,
          port: Number(process.env.MIKRO_ORM_PORT ?? 5432),
          user: process.env.MIKRO_ORM_USER,
        }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
