import { PrismaClient } from "@prisma/client/wasm";
import { PrismaPg } from "@prisma/adapter-pg";
import { cfEnv, cfExecCtx } from "./cf-env";

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

   ===== SIKLUS HIDUP CLIENT (WAJIB — sumber error 1101, 2026-10-24) =====
   Client Prisma (dan pool pg di dalamnya) TIDAK BOLEH dibagi antar-request
   di Workers. Socket yang dibuat pada request A lalu dipakai ulang request
   B memicu exception runtime workerd "Cannot perform I/O on behalf of a
   different request" yang lolos di callback socket pg → error 1101
   ("Worker threw a JavaScript exception") ±30% request setelah binding
   Hyperdrive aktif. Ini terdokumentasi resmi:
   - developers.cloudflare.com/hyperdrive/observability/troubleshooting
     ("Create a new database client on every request instead of caching it
     in a global variable. Hyperdrive's connection pooling already
     eliminates the connection startup overhead.")
   - prisma.io/docs/guides/deployment/cloudflare-workers
     ("Do not share a Prisma client across requests in a Worker.")
   Solusi: SATU client per request (WeakMap berkunci ExecutionContext),
   ditutup via ctx.waitUntil($disconnect) setelah respons selesai. Koneksi
   ke Supabase tetap hangat di sisi Hyperdrive, jadi request berikutnya
   tidak membayar ulang TCP+TLS ke origin. Di luar Workers (next build /
   dev Node) singleton biasa tetap dipakai. */

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
  // Pool per-request (client ini hidup selama SATU request saja):
  //  - connectionTimeoutMillis: gagal cepat (10 dtk) saat pooler sibuk,
  //    jangan menggantung selamanya (default 0) sampai request dibunuh CF.
  //  - max: trafik situs kecil; 4 koneksi/request cukup & hemat kuota.
  //  - onPoolError: error koneksi idle WAJIB ada listener — tanpa itu
  //    perilakunya diam/tidak terdefinisi; dengan ini tercatat di log CF.
  const adapter = new PrismaPg(
    {
      connectionString: url,
      max: 4,
      // SABUK PENGAMAN: tutup socket idle dalam 1 detik. OpenNext menyimpan
      // context di slot global yang bisa tertimpa request konkuren, sehingga
      // satu client bisa teradopsi lebih dari satu request — socket yang
      // bertahan lama di pool berisiko dipakai lintas konteks request
      // ("Cannot perform I/O on behalf of a different request" → 1101).
      // Dengan idle 1 dtk, socket nyaris mustahil bertahan antar-request.
      idleTimeoutMillis: 1_000,
      connectionTimeoutMillis: 10_000,
    },
    {
      onPoolError: (err) => {
        console.error("[db] pool error (koneksi idle dibuat ulang otomatis):", err.message);
      },
    },
  );
  return new PrismaClient({ adapter });
}

/* Client per-request: WeakMap berkunci objek ExecutionContext — tiap request
   Workers punya objek ctx unik, jadi kunci ini identik dengan batas request. */
const clientsPerRequest = new WeakMap<object, PrismaClient>();

/* Client singleton HANYA untuk konteks non-Workers (next build, dev Node,
   skrip lokal) — di sana tidak ada ExecutionContext dan tidak ada risiko
   berbagi socket antar-request runtime workerd. */
let singletonNonWorkers: PrismaClient | undefined;

function getDb(): PrismaClient {
  const rctx = cfExecCtx();
  if (!rctx) {
    if (!singletonNonWorkers) singletonNonWorkers = createClient();
    return singletonNonWorkers;
  }
  const existing = clientsPerRequest.get(rctx);
  if (existing) return existing;

  const client = createClient();
  clientsPerRequest.set(rctx, client);
  // Tutup pool socket milik request ini SETELAH respons selesai. waitUntil
  // menjaga isolate tetap hidup sampai penutupan beres; koneksi origin ke
  // Supabase tetap hangat di sisi Hyperdrive.
  if (typeof rctx.waitUntil === "function") {
    try {
      rctx.waitUntil(client.$disconnect().catch(() => undefined));
    } catch {
      /* waitUntil gagal didaftarkan — biarkan GC isolate yang membereskan */
    }
  }
  return client;
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
