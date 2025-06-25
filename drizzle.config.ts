// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './shared/schema.ts',             // ✅ Указываем правильный файл со схемами
  out: './migrations',                      // 📦 Куда сохранять миграции (оставь, если уже используешь)
  dialect: 'postgresql',                    // ✅ Для PostgreSQL
  dbCredentials: {
    url: process.env.DATABASE_URL!,         // ✅ Поддержка .env
  },
});
