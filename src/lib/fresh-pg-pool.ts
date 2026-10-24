import pg from "pg";
import type { EventEmitter as NEventEmitter } from "node:events";

/* ===== FreshQueryPool — pool pg yang TIDAK PERNAH memakai ulang socket =====

   LATAR BELAKANG (repro lab 2026-10-24, workerd asli via `wrangler dev
   --local` + tiruan server Postgres): pool pg standar menyimpan socket idle
   antar-request. Socket yang dibuat pada konteks request A akan diakhiri
   runtime saat konteks A berakhir — TANPA pg mengetahuinya. Query berikutnya
   yang mendapat socket zombie itu menggantung selamanya → watchdog workerd
   membunuh worker → error 1101 ("Worker threw a JavaScript exception") /
   "runtime canceled this request ... hung". Terbukti di produksi (±30-50%
   request DB gagal) dan tereproduksi penuh di lab.

   SOLUSI: timpa `query()` dan `connect()` — setiap query/koneksi transaksi
   memakai pg.Client SEGAR yang di-end segera setelah selesai (persis pola
   yang terbukti 100% bersih di lab: sekuensial + paralel + transaksi, NOL
   uncaught). Biaya: 1 TCP connect per query (±30-80 ms ke pooler Supabase).
   Kelak setelah Hyperdrive aktif, connect ini jadi lokal (sub-ms).

   KOMPATIBILITAS @prisma/adapter-pg (dibedah dari dist/index.mjs):
   - performIO  → this.client.query(queryObject, values)  → timpanan kita
   - startTransaction → this.client.connect() → conn.query/release/on
   - factory    → instanceof pg.Pool → externalPool; .options terbaca;
     dispose → removeListener("error") pada pool (tanpa end) → aman.
   Super-pool (kelas dasar) sengaja TIDAK PERNAH dipakai membuat koneksi
   (max 1, tak pernah di-query) — semua mesin idle-nya dorman. */

export class FreshQueryPool extends pg.Pool {
  private freshConfig: pg.ClientConfig;

  constructor(config: pg.PoolConfig) {
    // Super-pool hanya perlahkan ada agar instanceof pg.Pool valid;
    // ia tidak pernah membuat koneksi karena query/connect dioverride.
    super({ ...config, max: 1 });
    this.freshConfig = {
      connectionString: config.connectionString,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      ssl: config.ssl,
    };
  }

  /** Query reguler — pg.Client segar per panggilan, di-end di finally. */
  async query(
    q: string | pg.QueryConfig<unknown[]>,
    values?: unknown[],
  ): Promise<pg.QueryResult> {
    const client = new pg.Client(this.freshConfig);
    await client.connect();
    try {
      return values !== undefined
        ? await client.query(q as pg.QueryConfig<unknown[]>, values)
        : await client.query(q as pg.QueryConfig<unknown[]>);
    } finally {
      client.end().catch(() => undefined);
    }
  }

  /** Koneksi transaksi — client segar; release() = tutup client. */
  async connect(): Promise<pg.PoolClient> {
    // pg.Pool extends EventEmitter pada runtime — akses via cast karena
    // tipenya dari @types/pg tidak mengekspos warisan class dengan rapi.
    const ee = this as unknown as NEventEmitter;
    const client = new pg.Client(this.freshConfig);
    await client.connect();
    const onErr = (err: Error) => {
      try {
        ee.emit("error", err); // teruskan ke listener pool (adapter terpasang di sini)
      } catch {
        /* emit tanpa listener tidak melempar di Node; jaga-jaga saja */
      }
    };
    client.on("error", onErr);
    const poolClient = {
      query: (q: string | pg.QueryConfig<unknown[]>, v?: unknown[]) =>
        v !== undefined
          ? client.query(q as pg.QueryConfig<unknown[]>, v)
          : client.query(q as pg.QueryConfig<unknown[]>),
      release: () => {
        client.removeListener("error", onErr);
        client.end().catch(() => undefined);
      },
      on: (ev: string, fn: (...args: unknown[]) => void) => ee.on(ev, fn as never),
      removeListener: (ev: string, fn: (...args: unknown[]) => void) =>
        ee.removeListener(ev, fn as never),
    };
    return poolClient as unknown as pg.PoolClient;
  }
}
