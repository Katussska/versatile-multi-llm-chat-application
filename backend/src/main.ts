import { createServer } from 'node:net';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

dotenv.config({ path: resolve(__dirname, '..', '..', '.env'), quiet: true });
dotenv.config({
  path: resolve(__dirname, '..', '.env'),
  override: true,
  quiet: true,
});

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;

  while (true) {
    const isAvailable = await new Promise<boolean>((resolve) => {
      const server = createServer();

      server.once('error', () => {
        resolve(false);
      });

      server.once('listening', () => {
        server.close(() => resolve(true));
      });

      server.listen(port, '0.0.0.0');
    });

    if (isAvailable) {
      return port;
    }

    port += 1;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const preferredPort = Number(process.env.PORT ?? 3000);
  const port = await findAvailablePort(preferredPort);
  const host = process.env.HOST ?? 'localhost';

  await app.listen(port);

  console.info(`Backend is running at http://${host}:${port}`);

  if (port !== preferredPort) {
    console.warn(
      `Port ${preferredPort} is busy, backend is running on ${port} instead.`,
    );
  }
}
bootstrap();
