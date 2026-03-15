import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const OPENAPI_UI_PATH = 'api';

export function createOpenApiDocument(app: INestApplication) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cognify API')
    .setDescription('Cognify backend API')
    .setVersion('1.0.0')
    .build();

  return SwaggerModule.createDocument(app, swaggerConfig);
}

export function setupOpenApi(app: INestApplication) {
  const document = createOpenApiDocument(app);

  SwaggerModule.setup(OPENAPI_UI_PATH, app, document);

  return document;
}
