import 'dotenv/config';             // читает DATABASE_URL из переменных окружения
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/schema.ts',     // здесь у тебя описаны таблицы
  out: './migrations',              // куда складывать миграции
  driver: 'pg',                     // драйвер Postgres
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,   // !! на Vercel задаётся в настройках
  },
});
