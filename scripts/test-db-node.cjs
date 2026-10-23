/* Tes koneksi Prisma+pg adapter di Node murni — isolasi masalah engine.
   Pakai: DATABASE_URL="<string koneksi>" node scripts/test-db-node.cjs
   Contoh Supabase (Session pooler, salin dari Dashboard Supabase -> Connect):
   DATABASE_URL="postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require" */
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client/wasm");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("Set env DATABASE_URL dulu (lihat komentar di atas file).");
    process.exit(1);
  }
  let host = "(tak terbaca)";
  try {
    host = new URL(connectionString).host;
  } catch {}
  console.log("Menyambung ke:", host);
  const adapter = new PrismaPg({ connectionString });
  const db = new PrismaClient({ adapter });
  try {
    const rows = await db.category.findMany();
    console.log("QUERY OK, rows:", rows.length);
  } catch (err) {
    console.log("ERR name:", err && err.name);
    console.log("ERR msg:", String(err && err.message).slice(0, 400));
  }
  await db.$disconnect?.();
}

main();
