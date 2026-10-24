import { PrismaClient } from "@prisma/client/wasm";
import { PrismaPg } from "@prisma/adapter-pg";
import { cfEnv } from "./cf-env";
import { FreshQueryPool } from "./fresh-pg-pool";

/* ===== Resolusi koneksi DB untuk runtime Cloudflare Workers =====

   KENDALA FUNDAMENTAL (terbukti lewat pengujian di runtime workerd ASLI —
   `wrangler dev --local` memakai node_modules repo ini, 2026-10-24):
   - `pg` di Workers memakai cloudflare:sockets (pg-cloudflare). `startTls()`
     milik workerd TIDAK MENERIMA opsi apa pun: verifikasi sertifikat server
     terhadap CA publik selalu dijalankan dan tidak bisa dimatikan — objek
     ssl { rejectUnauthorized: false } pun DIABAIKON (terbukti diuji).
   - `sslmode=require` pada pg modern diperlakukan sebagai verify-full.
   - Sertifikat pooler Supabase ditandatangani CA PRIVAT Supabase, sehingga
     handshake TLS dari Workers SELALU gagal diam-diam; node-postgres hanya
     melaporkan "Connection terminated unexpectedly".
   - Pooler Supabase masih MENERIMA koneksi plaintext (sslmode=disable
     berhasil sampai tahap autentikasi — terbukti lewat probe yang sama).

   Konsekuensi desain:
   1. Tanpa Hyperdrive: host Supabase dipaksa `sslmode=disable` (interim,
      tidak terenkripsi). Risiko rendah untuk situs ini — data di DB hanya
      direktori UMKM/ulasan/pesan CS; password admin TIDAK pernah lewat DB
      (memakai Cloudflare Secrets).
   2. Jalur terenkripsi penuh = binding HYPERDRIVE (tersedia di plan Free,
      100 ribu query/hari): Hyperdrive menjalankan TLS ke Supabase dari
      jaringan Cloudflare, dan Worker terhubung ke Hyperdrive secara lokal.
      Begitu binding HYPERDRIVE terpasang, aplikasi OTOMATIS memakainya —
      tanpa perubahan kode lagi.

   ===== SIKLUS HIDUP CLIENT (WAJIB — pelajaran 2026-10-24) =====
   Dua desain ekstrem sama-sama GAGAL di OpenNext+workerd, terbukti log:
   a) Client singleton + $disconnect via ctx.waitUntil → "Cannot use a pool
      after calling end on the pool": OpenNext menyimpan context di slot
      global (Symbol.for("__cloudflare-context__")) yang objeknya TERPAKAI
      ULANG antar-request, sehingga pool yang sudah di-end oleh request
      sebelumnya masih diadopsi request berikutnya.
   b) Client per-request berkunci ExecutionContext → kunci tercemar
      mekanisme slot global yang sama (request konkuren menimpa slot) →
      socket lintas konteks → 1101 "I/O on behalf of a different request"
      ±30% request saat binding Hyperdrive aktif (dok:
      developers.cloudflare.com/hyperdrive/observability/troubleshooting).
   Desain FINAL (terbukti di lab workerd asli — NOL uncaught): FreshQueryPool
   (src/lib/fresh-pg-pool.ts) — setiap query memakai pg.Client SEGAR yang
   di-end segera setelah selesai. Tidak ada socket idle, tidak ada zombie,
   tidak ada reuse lintas-request. Biaya: 1 TCP connect per query (akan
   menjadi sub-ms begitu Hyperdrive aktif). Singleton PrismaClient tetap
   dipakai agar engine wasm tak di-init berulang. */

function isSupabaseHost(hostname: string): boolean {
  return /(^|\.)supabase\.(com|co)$/i.test(hostname);
}

/** Normalisasi string DATABASE_URL agar bisa terhubung dari runtime Workers. */
function normalizeForWorkers(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    if (!u.hostname) return rawUrl;
    if (isSupabaseHost(u.hostname)) {
      // CA privat Supabase + verifikasi workerd yang tak bisa dimatikan =
      // sslmode apa pun yang mengenkripsi PASTI gagal. Pooler menerima
      // plaintext → pakai itu sampai jalur Hyperdrive diaktifkan.
      u.searchParams.set("sslmode", "disable");
      return u.toString();
    }
    // Provider lain (Aiven/Neon — sertifikat CA publik): TLS berjalan normal
    // di workerd. verify-full/verify-ca tetap diturunkan ke require karena
    // file CA tidak bisa dibawa ke Workers.
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

function hyperdriveUrl(): string | null {
  const hyper = cfEnv().HYPERDRIVE as { connectionString?: unknown } | undefined;
  const cs = hyper?.connectionString;
  return typeof cs === "string" && cs.trim() ? cs.trim() : null;
}

function rawDatabaseUrl(): string | null {
  const raw = process.env.DATABASE_URL;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

type ResolvedConn = { source: "hyperdrive" | "database_url"; url: string };

function resolveConn(): ResolvedConn {
  const hyper = hyperdriveUrl();
  if (hyper) return { source: "hyperdrive", url: hyper };
  const raw = rawDatabaseUrl();
  if (!raw) {
    throw new Error("DATABASE_URL is not set (dan binding HYPERDRIVE tidak tersedia)");
  }
  return { source: "database_url", url: normalizeForWorkers(raw) };
}

function createClient(): PrismaClient {
  const { url } = resolveConn();
  // node-postgres driver — jalan di Workers (nodejs_compat + outbound TCP)
  // maupun Node.js biasa. Hyperdrive string dipakai apa adanya (TLS diurus
  // Hyperdrive; JANGAN menambah sslmode pada string binding).
  //
  // Pool anti-zombie: FreshQueryPool menimpa query()/connect() sehingga
  // SETIAP query memakai pg.Client segar yang ditutup segera setelah selesai
  // — tidak ada socket idle antar-request, tidak ada hang → tidak ada 1101.
  // (Lihat src/lib/fresh-pg-pool.ts untuk latar lengkap + bukti lab.)
  //  - connectionTimeoutMillis: gagal cepat (10 dtk) saat pooler sibuk.
  //  - onPoolError: listener error level-pool WAJIB ada — error klien yang
  //    tidak sedang mengeksekusi query diteruskan ke sini (tercatat di log).
  const pool = new FreshQueryPool({
    connectionString: url,
    connectionTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(
    pool,
    {
      onPoolError: (err) => {
        console.error("[db] pool error (klien dibuat ulang otomatis):", err.message);
      },
    },
  );
  return new PrismaClient({ adapter });
}

/* Singleton per isolate — SATU-satunya client; TIDAK PERNAH di-disconnect
   (yang diternak pendek adalah socket idle-nya, bukan pool-nya — lihat
   komentar "SIKLUS HIDUP CLIENT" di atas untuk pelajaran 2 desain gagal). */
let cachedClient: PrismaClient | undefined;

function getDb(): PrismaClient {
  if (!cachedClient) cachedClient = createClient();
  return cachedClient;
}

/* Proxy: PrismaClient dibuat SAAT DIPAKAI PERTAMA KALI (pasti berada di dalam
   konteks request Workers), bukan saat modul dimuat — getCloudflareContext()
   (untuk membaca binding HYPERDRIVE) hanya valid di dalam konteks request. */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === "then") return undefined;
    const real = getDb();
    const value = Reflect.get(real as object, prop, real);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(real);
    }
    return value;
  },
  has(_target, prop) {
    return Reflect.has(getDb() as object, prop);
  },
  getPrototypeOf() {
    return Object.getPrototypeOf(getDb());
  },
});

/** Info koneksi efektif TERSANITASI (tanpa password) — untuk log & /api/db-diag. */
export function describeResolvedConn(): string {
  try {
    const { source, url } = resolveConn();
    const u = new URL(url);
    const sslmode = u.searchParams.get("sslmode") ?? "(default)";
    return `sumber=${source} host=${u.hostname} port=${u.port || "(default)"} user=${u.username} db=${u.pathname.replace(/^\//, "") || "(kosong)"} sslmode=${sslmode}`;
  } catch (err) {
    return `sumber=(gagal diurai) ${err instanceof Error ? err.message : String(err)}`;
  }
}

/** String koneksi ter-resolve untuk diagnosis server-side (/api/db-diag).
    JANGAN pernah dikirim ke klien apa adanya — mengandung password. */
export function resolvedConnForDiagnostics(): ResolvedConn | null {
  try {
    return resolveConn();
  } catch {
    return null;
  }
}
