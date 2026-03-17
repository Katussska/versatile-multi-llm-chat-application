import { betterAuth } from 'better-auth';
import { mikroOrmAdapter } from 'better-auth-mikro-orm';
import type { MikroORM } from '@mikro-orm/core';

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

export function getAuth(env: AuthEnvironment = process.env, orm: MikroORM) {
  return betterAuth({
    database: mikroOrmAdapter(orm),
    baseURL: env.BETTER_AUTH_URL ?? getDefaultAuthUrl(env),
    basePath: '/api/auth',
    secret: getAuthSecret(env),
    advanced: {
      database: {
        generateId: false,
      },
    },
    trustedOrigins: [env.FRONTEND_ORIGIN ?? 'http://localhost:5173'],
    user: {
      fields: {
        emailVerified: 'email_verified',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      additionalFields: {
        admin: {
          type: 'boolean',
          required: false,
          defaultValue: false,
          input: false,
        },
      },
    },
    session: {
      fields: {
        userId: 'user_id',
        expiresAt: 'expires_at',
        ipAddress: 'ip_address',
        userAgent: 'user_agent',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    account: {
      fields: {
        accountId: 'account_id',
        providerId: 'provider_id',
        userId: 'user_id',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        idToken: 'id_token',
        accessTokenExpiresAt: 'access_token_expires_at',
        refreshTokenExpiresAt: 'refresh_token_expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    verification: {
      fields: {
        expiresAt: 'expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    emailAndPassword: {
      enabled: true,
    },
  });
}
