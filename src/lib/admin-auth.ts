import { NextRequest, NextResponse } from "next/server";

/**
 * Auth admin — dipakai oleh middleware DAN route handler (defense in depth).
 *
 * Dua cara lolos:
 *  1. Header `Authorization: Basic <b64(user:pass)>`  (dipakai browser saat buka /admin)
 *  2. Cookie `jk_admin` berisi token deterministik
 *     sha256(ADMIN_USERNAME:ADMIN_PASSWORD:jasakebumen-admin-v1)
 *     — di-set middleware setelah Basic auth sukses, supaya fetch() dari
 *     halaman admin ke /api/providers ikut terautentikasi (browser tidak
 *     selalu menyertakan ulang header Basic pada fetch lintas-path).
 *
 * Kredensial dibaca dari process.env (Cloudflare Secrets di produksi).
 * Jika belum diset, SEMUA akses admin gagal tertutup (fail closed, 503).
 */

export const ADMIN_COOKIE = "jk_admin";

export function adminEnv() {
  return {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  };
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expectedAdminToken(): Promise<string | null> {
  const { username, password } = adminEnv();
  if (!username || !password) return null;
  return sha256Hex(`${username}:${password}:jasakebumen-admin-v1`);
}

export function parseBasic(req: NextRequest): { user: string; pass: string } | null {
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6).trim());
    const idx = decoded.indexOf(":");
    if (idx < 0) return null;
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

/** true jika kredensial Basic di request cocok dengan env */
export function basicAuthValid(req: NextRequest): boolean {
  const { username, password } = adminEnv();
  if (!username || !password) return false;
  const creds = parseBasic(req);
  return !!creds && creds.user === username && creds.pass === password;
}

/** true jika cookie sesi admin valid */
export async function adminCookieValid(req: NextRequest): Promise<boolean> {
  const token = await expectedAdminToken();
  if (!token) return false;
  return req.cookies.get(ADMIN_COOKIE)?.value === token;
}

/**
 * Guard untuk route handler admin.
 * Return `null` jika lolos, atau Response 401/503 yang harus langsung dikembalikan.
 */
export async function requireAdmin(req: NextRequest): Promise<Response | null> {
  const token = await expectedAdminToken();
  if (!token) {
    return NextResponse.json({ error: "Admin belum dikonfigurasi." }, { status: 503 });
  }
  if (basicAuthValid(req)) return null;
  if (await adminCookieValid(req)) return null;
  return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
}
