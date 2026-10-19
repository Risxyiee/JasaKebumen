import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  adminEnv,
  expectedAdminToken,
  getDbAdmin,
  hashPassword,
} from "@/lib/admin-auth";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/login — PUBLIK. { username, password }
 * Menerima kredensial env (Cloudflare Secrets) ATAU kredensial DB
 * yang diatur lewat wizard setup di /admin. Sukses → set cookie sesi.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username dan sandi wajib diisi." },
      { status: 400 }
    );
  }

  let token: string | null = null;

  /* 1) Kredensial env (Cloudflare Secrets) — dalam mode ini DB diabaikan total */
  const envToken = await expectedAdminToken();
  const env = adminEnv();
  if (envToken && env.username && username === env.username && password === env.password) {
    token = envToken;
  }

  /* 2) Kredensial dari wizard setup (tabel AdminAuth) — hanya saat env tidak aktif */
  if (!token && !envToken) {
    const row = await getDbAdmin();
    if (row && username === row.username) {
      const hash = await hashPassword(password, row.salt);
      if (hash === row.passwordHash) token = row.sessionToken;
    }
  }

  if (!token) {
    return NextResponse.json(
      { error: "Username atau sandi salah." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return res;
}
