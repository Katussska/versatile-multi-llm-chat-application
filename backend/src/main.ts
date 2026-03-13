import { createServer } from 'node:net';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function findAvailablePort(
  startPort: number,
  host: string,
): Promise<number> {
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

      server.listen(port, host);
    });

    if (isAvailable) {
      return port;
    }

    port += 1;
  }
}

function getPreferredPort(): number {
  const defaultPort = 3000;
  const rawPort = process.env.PORT;

  if (rawPort === undefined) {
    return defaultPort;
  }

  const trimmedPort = rawPort.trim();
  const parsedPort = Number.parseInt(trimmedPort, 10);

  if (!/^\d+$/.test(trimmedPort) || !Number.isInteger(parsedPort)) {
    throw new Error(
      `Invalid PORT value "${rawPort}". PORT must be an integer between 1 and 65535.`,
    );
  }

  if (parsedPort < 1 || parsedPort > 65535) {
    throw new Error(
      `Invalid PORT value "${rawPort}". PORT must be between 1 and 65535.`,
    );
  }

  return parsedPort;
}

function isAddressInUseError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'EADDRINUSE'
  );
}

function shouldUsePortFallback(): boolean {
  const explicitFallbackFlag = process.env.PORT_FALLBACK;

  if (explicitFallbackFlag !== undefined) {
    const normalizedFlag = explicitFallbackFlag.trim().toLowerCase();

    if (['1', 'true', 'yes', 'on'].includes(normalizedFlag)) {
      return true;
    }

    if (['0', 'false', 'no', 'off'].includes(normalizedFlag)) {
      return false;
    }

    throw new Error(
      `Invalid PORT_FALLBACK value "${explicitFallbackFlag}". Use true/false.`,
    );
  }

  return process.env.NODE_ENV === 'development';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const preferredPort = getPreferredPort();
  const host = process.env.HOST ?? 'localhost';
  const allowFallback = shouldUsePortFallback();

  try {
    await app.listen(preferredPort, host);
    console.info(`Backend is running at http://${host}:${preferredPort}`);
    return;
  } catch (error) {
    if (!isAddressInUseError(error) || !allowFallback) {
      if (isAddressInUseError(error)) {
        throw new Error(
          `Port ${preferredPort} is already in use on host ${host}. ` +
            `Set a free PORT value or stop the process using that port. ` +
            `For local development, you can enable automatic fallback via PORT_FALLBACK=true or NODE_ENV=development.`,
        );
      }

      throw error;
    }

    const fallbackPort = await findAvailablePort(preferredPort + 1, host);
    await app.listen(fallbackPort, host);

    console.warn(
      `Port ${preferredPort} is busy, backend is running on ${fallbackPort} instead.`,
    );
    console.info(`Backend is running at http://${host}:${fallbackPort}`);
  }
}
bootstrap();
