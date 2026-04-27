import { defineConfig } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';

export default defineConfig({
  entities: ['dist/**/*.entity.js', 'dist/**/entities/*.js'],
  entitiesTs: ['src/**/*.entity.ts', 'src/**/entities/*.ts'],
  extensions: [SeedManager],
  migrations: {
    path: './dist/src/migrations',
    pathTs: './src/migrations',
  },
  seeder: {
    path: './dist/src/seeders',
    pathTs: './src/seeders',
    defaultSeeder: 'DatabaseSeeder',
  },
});
