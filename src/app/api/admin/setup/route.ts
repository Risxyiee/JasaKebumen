import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDb } from "@/lib/db-bootstrap";
import {
  ADMIN_COOKIE,
  ADMIN_ROW_ID,
  adminCookieOptions,
  generateSalt,
  generateSessionToken,
  hashPassword,
  verifySetupCode,
} from "@/lib/admin-auth";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-zA-Z0-9_.-]{4,40}$/;

/**
 * POST /api/admin/setup — PUBLIK, tetapi terkunci oleh KODE SETUP.
 *
 * { code, username, password }
 *  - code      : kode setup pemilik situs (diverifikasi sebagai SHA-256;
 *                repo hanya menyimpan hash-nya).
 *  - username  : 4-40 karakter huruf/angka/._-
 *  - password  : minimal 8 karakter.
 *
 * Bisa dipakai untuk pengaturan PERTAMA kali maupun ATUR ULANG kredensial
 * (misal sandi terlupa) — keduanya butuh kode setup yang sama.
 * Sukses → baris AdminAuth dibuat/diperbarui + cookie sesi langsung aktif.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!code) {
    return NextResponse.json({ error: "Kode setup wajib diisi." }, { status: 400 });
  }
  if (!(await verifySetupCode(code))) {
    return NextResponse.json(
      { error: "Kode setup salah. Kode ini hanya diketahui pemilik situs." },
      { status: 403 }
    );
  }

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username 4-40 karakter, hanya huruf, angka, titik, garis bawah, atau garis." },
      { status: 400 }
    );
  }
  if (password.length < 8 || password.length > 100) {
    return NextResponse.json(
      { error: "Sandi minimal 8 karakter (maksimal 100)." },
      { status: 400 }
    );
  }

  const dbReady = await ensureDb();
  if (!dbReady) {
    return NextResponse.json(
      { error: "Database belum terjangkau. Pastikan DATABASE_URL sudah diset, lalu coba lagi." },
      { status: 503 }
    );
  }

  try {
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const sessionToken = generateSessionToken();

    await db.adminAuth.upsert({
      where: { id: ADMIN_ROW_ID },
      update: { username, passwordHash, salt, sessionToken },
      create: { id: ADMIN_ROW_ID, username, passwordHash, salt, sessionToken },
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, sessionToken, adminCookieOptions());
    return res;
  } catch (error) {
    console.error("[admin-setup] error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan kredensial. Coba beberapa saat lagi." },
      { status: 500 }
    );
  }
}
