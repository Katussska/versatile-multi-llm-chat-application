import { Pool } from 'pg';
import { betterAuth } from 'better-auth';

type AuthEnvironment = NodeJS.ProcessEnv;

function getDefaultAuthUrl(env: AuthEnvironment): string {
  const host = env.HOST ?? 'localhost';
  const port = env.PORT ?? '3000';
  return `http://${host}:${port}`;
}

function getAuthSecret(env: AuthEnvironment): string {
  const secret = env.BETTER_AUTH_SECRET;

  if (secret && secret.trim().length >= 32) {
    return secret.trim();
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'BETTER_AUTH_SECRET is required in production and must be at least 32 characters.',
    );
  }

  // Keep local development friction low while requiring a real secret in production.
  console.warn(
    'BETTER_AUTH_SECRET is missing. Using an insecure development fallback secret.',
  );

  return 'dev-only-better-auth-secret-change-me-please';
}

function getAuthSchema(env: AuthEnvironment): string {
  const rawSchema = env.BETTER_AUTH_SCHEMA ?? 'auth';
  const schema = rawSchema.trim();

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
    throw new Error(
      `Invalid BETTER_AUTH_SCHEMA value "${rawSchema}". Use a valid PostgreSQL schema identifier.`,
    );
  }

  return schema;
}

export function getAuth(env: AuthEnvironment = process.env) {
  const authSchema = getAuthSchema(env);

  const database = new Pool({
    host: env.MIKRO_ORM_HOST ?? 'localhost',
    port: Number(env.MIKRO_ORM_PORT ?? 5432),
    database: env.MIKRO_ORM_DB_NAME ?? 'cognify',
    user: env.MIKRO_ORM_USER ?? 'postgres',
    password: env.MIKRO_ORM_PASSWORD ?? 'postgres',
    options: `-c search_path=${authSchema},public`,
  });

  return betterAuth({
    database,
    baseURL: env.BETTER_AUTH_URL ?? getDefaultAuthUrl(env),
    basePath: '/api/auth',
    secret: getAuthSecret(env),
    trustedOrigins: [env.FRONTEND_ORIGIN ?? 'http://localhost:5173'],
    emailAndPassword: {
      enabled: true,
    },
  });
}
