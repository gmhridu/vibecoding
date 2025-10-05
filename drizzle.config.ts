import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",

  // ✅ Supported in latest drizzle-kit
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  migrations: {
    prefix: "timestamp",
    table: "__drizzle_migrations__",
    schema: "public",
  },

  schemaFilter: ["public"],
  verbose: true,
  strict: true,
  breakpoints: true,
});
