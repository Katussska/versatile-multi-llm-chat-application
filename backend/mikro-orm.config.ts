import { defineConfig } from '@mikro-orm/postgresql';

export default defineConfig({
  entities: ['dist/**/*.entity.js', 'dist/**/entities/*.js'],
  entitiesTs: ['src/**/*.entity.ts', 'src/**/entities/*.ts'],
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
  },
});
