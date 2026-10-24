import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { requireAdmin } from "@/lib/admin-auth";
import { describeConn, ensureDb } from "@/lib/db-bootstrap";
import { describeResolvedConn, resolvedConnForDiagnostics } from "@/lib/db";

export const dynamic = "force-dynamic";

/* Alat diagnosis database — KHUSUS ADMIN (guard requireAdmin).
   Menampilkan:
   - secret      : isi mentah DATABASE_URL tersanitasi (tanpa password)
   - efektif     : koneksi yang BENAR-BENAR dipakai aplikasi (sumber
                   hyperdrive/database_url + sslmode pasca-normalisasi)
   - attempts    : percobaan koneksi nyata dari dalam Worker (password
                   memakai kredensial asli → bila "OK", DB benar-benar siap)
   - dbReady     : hasil bootstrap skema + data referensi
   Catatan TLS (terbukti diuji di workerd): koneksi terenkripsi dari Workers
   ke pooler Supabase selalu gagal (CA privat Supabase vs verifikasi workerd
   yang tidak bisa dimatikan). Jalur terenkripsi penuh = binding HYPERDRIVE. */

/** Satu percobaan koneksi mandiri (pg murni, bukan Prisma) dengan varian URL tertentu. */
async function attempt(rawUrl: string, label: string): Promise<{ mode: string; result: string }> {
  const client = new Client({ connectionString: rawUrl, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    return { mode: label, result: "OK — koneksi & autentikasi berhasil" };
  } catch (err) {
    const e = err as Error & { code?: string; message?: string };
    const msg = String(e?.message || err)
      .replace(/\n/g, " ")
      .slice(0, 180);
    return { mode: label, result: `gagal: ${e?.code ? `[${e.code}] ` : ""}${msg}` };
  } finally {
    try {
      await client.end();
    } catch {
      /* abaikan */
    }
  }
}

function withSslMode(url: string, mode: "require" | "disable"): string {
  try {
    const u = new URL(url);
    u.searchParams.set("sslmode", mode);
    return u.toString();
  } catch {
    return url;
  }
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const resolved = resolvedConnForDiagnostics();
  const attempts: { mode: string; result: string }[] = [];

  if (resolved) {
    // Jalur yang DIPAKAI APLIKASI — menguji kredensial asli dari dalam Worker.
    attempts.push(await attempt(resolved.url, `jalur aplikasi (sumber: ${resolved.source})`));
    if (resolved.source === "database_url") {
      attempts.push(
        await attempt(
          withSslMode(resolved.url, "require"),
          "sslmode=require (TLS workerd — utk Supabase diharapkan GAGAL: CA privat, verifikasi workerd tidak bisa dimatikan)",
        ),
      );
    }
  }

  const dbReady = await ensureDb();

  return NextResponse.json({
    secret: describeConn(process.env.DATABASE_URL),
    efektif: describeResolvedConn(),
    attempts,
    dbReady,
  });
}
