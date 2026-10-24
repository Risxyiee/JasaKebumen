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
import { db, describeResolvedConn } from "@/lib/db";
import { REF_CATEGORIES, REF_DISTRICTS } from "@/lib/reference";

/**
 * Ubah error apa pun (termasuk error jaringan node-postgres di Workers yang
 * pesannya kosong / hanya stack) menjadi teks satu baris yang benar-benar
 * informatif: nama error, pesan, dan rantai `cause`-nya. Tanpa ini, log
 * Cloudflare hanya memperlihatkan "at worker.js:..." dan penyebab gagalnya
 * koneksi DB tidak terbaca.
 */
export function describeError(err: unknown): string {
  if (err instanceof Error) {
    const parts = [`${err.name}: ${err.message || "(tanpa pesan)"}`];
    let cause: unknown = (err as Error & { cause?: unknown }).cause;
    let depth = 0;
    while (cause && depth < 3) {
      if (cause instanceof Error) {
        parts.push(`cause: ${cause.name}: ${cause.message || "(tanpa pesan)"}`);
        cause = (cause as Error & { cause?: unknown }).cause;
      } else {
        parts.push(`cause: ${String(cause)}`);
        cause = undefined;
      }
      depth++;
    }
    return parts.join(" | ");
  }
  return String(err);
}

/**
 * Info koneksi TERSANITASI (tanpa password) — dilampirkan pada log gagal
 * agar masalah string DATABASE_URL bisa didiagnosis langsung dari log
 * Cloudflare tanpa perlu bertanya-tanya: host/region salah, port salah,
 * user salah, atau sslmode bermasalah semua langsung terlihat.
 */
export function describeConn(url: string | undefined): string {
  if (!url) return "DATABASE_URL: (kosong)";
  try {
    const u = new URL(url);
    if (!u.hostname) return "DATABASE_URL: (format tidak bisa diurai)";
    const sslmode = u.searchParams.get("sslmode") ?? "(tidak diset)";
    return `conn: host=${u.hostname} port=${u.port || "(default)"} user=${u.username} db=${u.pathname.replace(/^\//, "") || "(kosong)"} sslmode=${sslmode}`;
  } catch {
    return "DATABASE_URL: (format tidak bisa diurai)";
  }
}

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
  `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "address" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "waClicks" INTEGER NOT NULL DEFAULT 0`,
  `CREATE TABLE IF NOT EXISTS "WaClick" (
    "id"         TEXT PRIMARY KEY,
    "providerId" TEXT NOT NULL REFERENCES "Provider"("id") ON DELETE CASCADE,
    "source"     TEXT NOT NULL DEFAULT 'profil',
    "createdAt"  TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "WaClick_providerId_createdAt_idx" ON "WaClick"("providerId", "createdAt")`,
  /* Koreksi data referensi: 3 nama di daftar lama BUKAN kecamatan Kabupaten
     Kebumen (Panjer = desa di Kec. Kebumen; Somagede & Kalibangkang = kecamatan
     Kab. Banyumas). Baris dihapus hanya jika tidak ada usaha yang masih
     merujuknya, agar usaha lama tidak ikut terhapus. */
  `DELETE FROM "District" WHERE "slug" IN ('panjer', 'somagede', 'kalibangkang')
    AND NOT EXISTS (SELECT 1 FROM "Provider" p WHERE p."districtId" = "District"."id")`,
  `CREATE TABLE IF NOT EXISTS "Review" (
    "id"         TEXT PRIMARY KEY,
    "providerId" TEXT NOT NULL REFERENCES "Provider"("id") ON DELETE CASCADE,
    "name"       TEXT NOT NULL,
    "rating"     INTEGER NOT NULL,
    "comment"    TEXT NOT NULL DEFAULT '',
    "status"     TEXT NOT NULL DEFAULT 'pending',
    "createdAt"  TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "Review_providerId_status_idx" ON "Review"("providerId", "status")`,
  `CREATE TABLE IF NOT EXISTS "CsMessage" (
    "id"        TEXT PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "name"      TEXT NOT NULL DEFAULT '',
    "contact"   TEXT NOT NULL DEFAULT '',
    "text"      TEXT NOT NULL,
    "handled"   BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "CsMessage_sessionId_idx" ON "CsMessage"("sessionId")`,
  `CREATE INDEX IF NOT EXISTS "CsMessage_handled_createdAt_idx" ON "CsMessage"("handled", "createdAt")`,
  `CREATE TABLE IF NOT EXISTS "AdminAuth" (
    "id"           TEXT PRIMARY KEY,
    "username"     TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "salt"         TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "createdAt"    TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMPTZ(3) NOT NULL
  )`,
  /* KHUSUS SUPABASE — wajib: tabel baru di schema public otomatis diekspos
     lewat Data API (REST /rest/v1) dengan kunci anon yang semipublik. Tanpa
     RLS, siapa pun yang punya kunci anon bisa BACA/TULIS semua baris:
     nomor WA penjual, hash password admin, token sesi, pesan chat.
     RLS aktif + tanpa policy = anon/authenticated tidak melihat apa pun,
     sedangkan aplikasi ini terhubung sebagai role pemilik tabel (postgres)
     yang lewat dari RLS. Perilaku di provider lain (Aiven/Neon) tidak berubah.
     Idempoten — aman dijalankan berulang tiap cold start. */
  `ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "District" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "Provider" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "WaClick"  ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "Review"   ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "CsMessage" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "AdminAuth" ENABLE ROW LEVEL SECURITY`,
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
        console.error(
          "[db-bootstrap] gagal:",
          describeError(err),
          "|",
          describeResolvedConn(), // koneksi EFEKTIF (hyperdrive/database_url + sslmode pasca-normalisasi)
          "|",
          describeConn(process.env.DATABASE_URL), // isi mentah secret
        );
        globalForBootstrap.jkDbReady = undefined; // reset — panggilan berikutnya coba lagi
        return false;
      }
    })();
  }
  return globalForBootstrap.jkDbReady;
}
