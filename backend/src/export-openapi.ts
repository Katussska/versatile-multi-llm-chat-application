import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createOpenApiDocument } from './openapi';

async function bootstrap() {
  const outputPath = resolve(process.cwd(), process.argv[2] ?? '../frontend/openapi.json');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  const document = createOpenApiDocument(app);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await app.close();

  console.info(`OpenAPI schema written to ${outputPath}`);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to export OpenAPI schema.', error);
  process.exitCode = 1;
});