/**
 * Self-healing database bootstrap (server-only).
 *
 * Masalah yang diselesaikan: database produksi mungkin baru dibuat / belum
 * di-push skemanya / belum di-seed. Karena kita tidak bisa menjalankan
 * `prisma db push` di Workers, semua DDL & seed referensi dijalankan
 * idempoten saat runtime (sekali per isolate):
 *  - ensureSchema()          → CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS
 *  - ensureReferenceData()   → upsert kategori & kecamatan (ID deterministik)
 *
 * Semua fungsi TIDAK PERNAH melempar error — pemanggil tetap punya fallback.
 */
import { db } from "@/lib/db";
import { REF_CATEGORIES, REF_DISTRICTS } from "@/lib/reference";

/* DDL dipecah per-statement: protocol prepared-statement node-postgres
   tidak mendukung multi-statement dalam satu query. */
const DDL_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS "Category" (
    "id"        TEXT PRIMARY KEY,
    "name"      TEXT NOT NULL UNIQUE,
    "slug"      TEXT NOT NULL UNIQUE,
    "icon"      TEXT NOT NULL DEFAULT 'zap',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "District" (
    "id"        TEXT PRIMARY KEY,
    "name"      TEXT NOT NULL UNIQUE,
    "slug"      TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Provider" (
    "id"             TEXT PRIMARY KEY,
    "name"           TEXT NOT NULL,
    "description"    TEXT NOT NULL DEFAULT '',
    "whatsappNumber" TEXT NOT NULL,
    "imageUrl"       TEXT,
    "images"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status"         TEXT NOT NULL DEFAULT 'pending',
    "createdAt"      TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMPTZ(3) NOT NULL,
    "categoryId"     TEXT NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE,
    "districtId"     TEXT NOT NULL REFERENCES "District"("id") ON DELETE CASCADE
  )`,
  `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`,
];

async function ensureSchema(): Promise<void> {
  for (const stmt of DDL_STATEMENTS) {
    await db.$executeRawUnsafe(stmt);
  }
}

async function ensureReferenceData(): Promise<void> {
  for (const c of REF_CATEGORIES) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { id: c.id, name: c.name, slug: c.slug, icon: c.icon },
    });
  }
  for (const d of REF_DISTRICTS) {
    await db.district.upsert({
      where: { slug: d.slug },
      update: {},
      create: { id: d.id, name: d.name, slug: d.slug },
    });
  }
}

const globalForBootstrap = globalThis as unknown as {
  jkDbReady: Promise<boolean> | undefined;
};

/** Jalankan sekali per isolate; true = DB siap, false = DB tidak terjangkau. */
export function ensureDb(): Promise<boolean> {
  if (!globalForBootstrap.jkDbReady) {
    globalForBootstrap.jkDbReady = (async () => {
      try {
        await ensureSchema();
        await ensureReferenceData();
        return true;
      } catch (err) {
        console.error("[db-bootstrap] gagal:", err);
        globalForBootstrap.jkDbReady = undefined; // reset — panggilan berikutnya coba lagi
        return false;
      }
    })();
  }
  return globalForBootstrap.jkDbReady;
}
