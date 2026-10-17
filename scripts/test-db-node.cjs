/* Tes koneksi Prisma+pg adapter di Node murni — isolasi masalah engine */
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client/wasm");

async function main() {
  const adapter = new PrismaPg({
    connectionString:
      "postgresql://avnadmin:placeholder@pg-CHANGE_ME.aivencloud.com:27378/defaultdb?sslmode=require",
  });
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
