import { PrismaClient } from "@prisma/client/wasm";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/* Normalisasi sslmode untuk host database managed (Supabase/Neon/Aiven).

   Masalah nyata yang diatasi (log CF 2026-10-24): string koneksi Supabase
   dari sebagian halaman dok/dashboard memakai `sslmode=verify-full`, sementara
   sertifikat pooler Supabase ditandatangani CA PRIVAT Supabase ("self-signed
   certificate in certificate chain" — terbukti lewat probe TLS). Cloudflare
   Workers tidak bisa membawa file CA tersebut, sehingga handshake TLS gagal
   dan node-postgres hanya melaporkan "Connection terminated unexpectedly".

   `sslmode=require` tetap mengenkripsi seluruh koneksi (TLS penuh), hanya
   tanpa verifikasi rantai CA — pola yang sama dipakai Aiven sejak awal dan
   terbukti stabil di Workers. Selain itu URL di-normalisasi (password dengan
   karakter khusus ikut ter-escape dengan benar). */
function normalizeSsl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    if (!u.hostname) return rawUrl;
    const managed = /(^|\.)supabase\.(com|co)$|\.neon\.tech$|\.aivencloud\.com$/.test(
      u.hostname,
    );
    if (!managed) return rawUrl;
    const mode = u.searchParams.get("sslmode");
    if (mode === "verify-full" || mode === "verify-ca") {
      u.searchParams.set("sslmode", "require");
      return u.toString();
    }
    if (!mode && !u.searchParams.has("ssl")) {
      u.searchParams.set("sslmode", "require");
      return u.toString();
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

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
  // sslmode=verify-full TIDAK jalan di Workers (tidak ada file CA) —
  // normalizeSsl() di atas menurunkannya otomatis ke require.
  const adapter = new PrismaPg({ connectionString: normalizeSsl(url) });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
