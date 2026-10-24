import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { requireAdmin } from "@/lib/admin-auth";
import { describeConn, ensureDb } from "@/lib/db-bootstrap";

export const dynamic = "force-dynamic";

/* Alat diagnosis database — KHUSUS ADMIN (guard requireAdmin).
   Menampilkan info koneksi tersanitasi (tanpa password) + hasil percobaan
   koneksi mandiri dengan beberapa mode SSL, langsung dari dalam Worker.
   Tujuan: melokalisasi masalah TLS/auth Supabase tanpa harus membaca log. */

/** Satu percobaan koneksi mandiri (pg murni, bukan Prisma) dengan varian URL tertentu. */
async function attempt(rawUrl: string, label: string): Promise<{ mode: string; result: string }> {
  const client = new Client({ connectionString: rawUrl, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    return { mode: label, result: "OK — koneksi & autentikasi berhasil" };
  } catch (err) {
    const msg = String((err as Error & { message?: string })?.message || err)
      .replace(/\n/g, " ")
      .slice(0, 180);
    return { mode: label, result: `gagal: ${msg}` };
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

  const url = process.env.DATABASE_URL;
  const conn = describeConn(url);

  if (!url) {
    return NextResponse.json({ conn, attempts: [], dbReady: false });
  }

  const attempts = [
    await attempt(withSslMode(url, "require"), "sslmode=require (TLS, tanpa verifikasi CA)"),
    await attempt(withSslMode(url, "disable"), "sslmode=disable (tanpa TLS)"),
  ];

  const dbReady = await ensureDb();

  return NextResponse.json({ conn, attempts, dbReady });
}
