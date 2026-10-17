import { PrismaClient } from "@prisma/client/wasm";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  // node-postgres driver — connects to any PostgreSQL (Aiven, Neon, Supabase, dll.)
  // Works on Cloudflare Workers via nodejs_compat (outbound TCP) and on Node.js.
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
