import { defineConfig } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';

export default defineConfig({
  entities: ['dist/**/*.entity.js', 'dist/**/entities/*.js'],
  entitiesTs: ['src/**/*.entity.ts', 'src/**/entities/*.ts'],
  extensions: [SeedManager],
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
  },
  seeder: {
    path: './dist/seeders',
    pathTs: './src/seeders',
    defaultSeeder: 'DatabaseSeeder',
  },
});
