import { defineConfig } from "prisma/config";

const localDatabaseUrl =
  "postgresql://quantflow:quantflow_dev@localhost:5434/quantflow?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? localDatabaseUrl,
  },
});
