
import { config } from 'dotenv'; config({ path: '../.env' }); // ⬅️ перед defineConfig
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./schema/schema.ts", // ✅ актуальный путь
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
