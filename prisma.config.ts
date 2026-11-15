import { config } from "dotenv";

// One env file for everything: .env.local first (same file `next dev` reads), then .env
// for anything not defined there. dotenv never overrides, so .env.local wins.
config({ path: ".env.local" });
config();
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  },
});
