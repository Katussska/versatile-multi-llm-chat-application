import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { MikroORM } from '@mikro-orm/core';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { setupOpenApi } from './openapi';

type TableExistsRow = {
  exists: boolean;
};

type CountRow = {
  count: number | string;
};

function parseOrigins(rawOrigins: string): string[] {
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function getAllowedOrigins(): string[] {
  const fallbackOrigin = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
  const rawOrigins =
    process.env.FRONTEND_ORIGIN ?? `${fallbackOrigin},http://localhost:5173`;

  const parsedOrigins = parseOrigins(rawOrigins);
  if (parsedOrigins.length > 0) {
    return parsedOrigins;
  }

  return ['http://localhost:5173'];
}

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

function shouldEnableOpenApi(): boolean {
  const explicitOpenApiFlag = process.env.OPENAPI_ENABLED;

  if (explicitOpenApiFlag !== undefined) {
    const normalizedFlag = explicitOpenApiFlag.trim().toLowerCase();

    if (['1', 'true', 'yes', 'on'].includes(normalizedFlag)) {
      return true;
    }

    if (['0', 'false', 'no', 'off'].includes(normalizedFlag)) {
      return false;
    }

    throw new Error(
      `Invalid OPENAPI_ENABLED value "${explicitOpenApiFlag}". Use true/false.`,
    );
  }

  // Default: enable in non-production, disable in production.
  return process.env.NODE_ENV !== 'production';
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const rawValue = process.env[name];

  if (rawValue === undefined) {
    return fallback;
  }

  const normalizedValue = rawValue.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalizedValue)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalizedValue)) {
    return false;
  }

  throw new Error(`Invalid ${name} value "${rawValue}". Use true/false.`);
}

async function shouldSeedForFreshDatabase(orm: MikroORM): Promise<boolean> {
  const tableExistsRows = await orm.em.getConnection().execute<TableExistsRow[]>(
    `
      select to_regclass('public.mikro_orm_migrations') is not null as exists
    `,
  );

  const migrationTableExists = tableExistsRows[0]?.exists === true;

  if (!migrationTableExists) {
    return true;
  }

  const migrationCountRows = await orm.em
    .getConnection()
    .execute<CountRow[]>(`select count(*) as count from "mikro_orm_migrations"`);

  const migrationCount = Number(migrationCountRows[0]?.count ?? 0);

  return migrationCount === 0;
}

async function initializeDatabaseIfNeeded(
  app: NestExpressApplication,
): Promise<void> {
  const shouldBootstrapOnEmptyDb = parseBooleanEnv(
    'DB_BOOTSTRAP_ON_EMPTY',
    true,
  );

  if (!shouldBootstrapOnEmptyDb) {
    return;
  }

  const orm = app.get(MikroORM);
  const shouldSeedBecauseFreshDatabase = await shouldSeedForFreshDatabase(orm);

  console.info('Running pending database migrations...');
  await orm.migrator.up();
  console.info('Database migrations check completed.');

  const shouldSeedOnEmptyDb = parseBooleanEnv('DB_SEED_ON_EMPTY', true);

  if (!shouldSeedOnEmptyDb || !shouldSeedBecauseFreshDatabase) {
    return;
  }

  console.info('Seeding initial data...');
  await orm.seeder.seedString('DatabaseSeeder');
  console.info('Initial database seed completed.');
}

const SPA_EXCLUDED_PATH_PREFIXES = ['/api', '/api-json'];

function isExcludedFromSpaFallback(path: string): boolean {
  return SPA_EXCLUDED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function resolveFrontendDistPath(): string | null {
  const candidatePaths = [
    join(__dirname, 'public'),
    join(__dirname, '..', 'public'),
  ];

  for (const candidatePath of candidatePaths) {
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  await initializeDatabaseIfNeeded(app);

  app.setGlobalPrefix('api');

  const frontendDistPath = resolveFrontendDistPath();
  if (frontendDistPath !== null) {
    app.useStaticAssets(frontendDistPath);

    // Handle SPA routes while keeping API calls untouched.
    app.use((request: Request, response: Response, next: NextFunction) => {
      if (request.method !== 'GET') {
        next();
        return;
      }

      if (request.path.includes('.')) {
        next();
        return;
      }

      if (isExcludedFromSpaFallback(request.path)) {
        next();
        return;
      }

      const acceptHeader = request.headers.accept ?? '';
      if (!acceptHeader.includes('text/html')) {
        next();
        return;
      }

      response.sendFile(join(frontendDistPath, 'index.html'));
    });
  }

  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
  });

  if (shouldEnableOpenApi()) {
    setupOpenApi(app);
  }

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

void bootstrap();
