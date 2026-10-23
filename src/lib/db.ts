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

  // node-postgres driver — connects to any PostgreSQL (Supabase, Neon, Aiven, dll.)
  // Works on Cloudflare Workers via nodejs_compat (outbound TCP) and on Node.js.
  //
  // CATATAN SUPABASE: pakai string "Session pooler" (port 5432, host
  // aws-0-<region>.pooler.supabase.com, user postgres.<ref>) yang disalin dari
  // Dashboard Supabase -> Connect, lalu tambahkan ?sslmode=require.
  // JANGAN pakai host db.<ref>.supabase.co (Direct) untuk Workers — host itu
  // IPv6-only dan sertifikatnya CA privat Supabase, bukan CA publik.
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
