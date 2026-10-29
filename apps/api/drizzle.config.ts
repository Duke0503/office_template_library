import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: ['./src/modules/catalog/adapters/schema.ts', './src/modules/workspace/adapters/schema.ts'],
  out: './drizzle',
});
