import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { setupOpenApi } from '../src/openapi';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
class TestAppModule {}

describe('AppController (e2e)', () => {
  async function bootstrapApp(
    enableOpenApi: boolean,
  ): Promise<INestApplication<App>> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    const nestApp = moduleFixture.createNestApplication();

    if (enableOpenApi) {
      setupOpenApi(nestApp);
    }

    await nestApp.init();
    return nestApp;
  }

  it('/ (GET)', async () => {
    const app = await bootstrapApp(false);

    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');

    await app.close();
  });

  it('exposes OpenAPI JSON and Swagger UI when enabled', async () => {
    const app = await bootstrapApp(true);

    await request(app.getHttpServer())
      .get('/api-json')
      .expect(200)
      .expect((response) => {
        expect(response.body.openapi).toBeDefined();
        expect(response.body.paths?.['/']).toBeDefined();
      });

    await request(app.getHttpServer())
      .get('/api/')
      .expect(200)
      .expect('Content-Type', /html/);

    await app.close();
  });

  it('does not expose OpenAPI endpoints when disabled', async () => {
    const app = await bootstrapApp(false);

    await request(app.getHttpServer()).get('/api-json').expect(404);
    await request(app.getHttpServer()).get('/api/').expect(404);

    await app.close();
  });
});
