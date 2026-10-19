import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Auth admin — dipakai oleh semua route handler admin (satu-satunya gerbang,
 * middleware dihapus agar tidak duplikat).
 *
 * DUA MODE, saling eksklusif:
 *
 *  MODE CLOUDFLARE (eksklusif, paling aman) — aktif otomatis begitu secrets
 *  `ADMIN_USERNAME` + `ADMIN_PASSWORD` terpasang di Cloudflare Workers.
 *  Satu-satunya jalan masuk adalah kredensial dari secrets tersebut.
 *  Wizard web / kode setup / kredensial DB diabaikan TOTAL:
 *   - POST /api/admin/setup  → selalu 403
 *   - POST /api/admin/login  → hanya cocok env
 *   - cookie sesi            → hanya token env yang diakui
 *
 *  MODE DATABASE (fallback) — dipakai hanya jika env belum diset.
 *  Kredensial tersimpan di tabel AdminAuth (satu baris id "admin"), diatur
 *  lewat wizard pengaturan awal di /admin yang dibuka dengan KODE SETUP
 *  yang hanya diketahui pemilik situs (repo hanya menyimpan hash SHA-256
 *  dari kodenya, preimage acak kuat).
 *
 * Sesi: cookie `jk_admin` berisi token.
 *  - Sumber env  → token deterministik sha256(user:pass:jasakebumen-admin-v1)
 *  - Sumber DB   → token acak 32 byte tersimpan di kolom sessionToken
 */

export const ADMIN_COOKIE = "jk_admin";
export const ADMIN_ROW_ID = "admin";

/* SHA-256 dari kode setup (lihat komentar di atas). */
const SETUP_CODE_HASH =
  "17f8e2a00ce9194a0e85f25e1fe0754e0f1430ada777ca63aa704e023c7c496b";

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

/**
 * MODE CLOUDFLARE aktif? — true jika ADMIN_USERNAME + ADMIN_PASSWORD
 * keduanya terpasang. Begitu aktif, mode DB dan wizard web ditutup total.
 */
export async function envModeActive(): Promise<boolean> {
  return !!(await expectedAdminToken());
}

/* ---------- Kredensial di database ---------- */

export interface DbAdmin {
  username: string;
  passwordHash: string;
  salt: string;
  sessionToken: string;
}

/** Ambil baris kredensial admin dari DB; null = belum diset / DB gagal. */
export async function getDbAdmin(): Promise<DbAdmin | null> {
  try {
    const row = await db.adminAuth.findUnique({ where: { id: ADMIN_ROW_ID } });
    if (!row) return null;
    return {
      username: row.username,
      passwordHash: row.passwordHash,
      salt: row.salt,
      sessionToken: row.sessionToken,
    };
  } catch {
    return null; // DB belum siap / DATABASE_URL belum diset — fail closed
  }
}

/**
 * Hash sandi untuk kredensial DB. Satu putaran SHA-256 + salt (bukan
 * PBKDF2 berat) karena batas CPU Cloudflare Workers; risiko dikompensasi
 * dengan salt acak per-akun dan kebijakan sandi minimal 8 karakter.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`jk-admin-v2:${salt}:${password}`);
}

export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** true jika kode setup yang dimasukkan pemilik cocok dengan hash di repo. */
export async function verifySetupCode(code: string): Promise<boolean> {
  if (!code) return false;
  const hash = await sha256Hex(code.trim().toUpperCase());
  return hash === SETUP_CODE_HASH;
}

/* ---------- Verifikasi request ---------- */

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

/**
 * true jika cookie sesi admin valid.
 * Mode Cloudflare → hanya token env yang diakui (eksklusif, DB tak disentuh).
 * Mode DB         → token env ATAU token DB.
 */
export async function adminCookieValid(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const envToken = await expectedAdminToken();
  if (envToken) return token === envToken; // eksklusif env — jangan cek DB

  const row = await getDbAdmin();
  return !!row && row.sessionToken === token;
}

/** true jika sumber kredensial mana pun sudah tersedia */
export async function adminConfigured(): Promise<boolean> {
  const envToken = await expectedAdminToken();
  if (envToken) return true;
  return !!(await getDbAdmin());
}

/**
 * Guard untuk route handler admin.
 * Return `null` jika lolos, atau Response 401/503 yang harus langsung dikembalikan.
 */
export async function requireAdmin(req: NextRequest): Promise<Response | null> {
  if (basicAuthValid(req)) return null;
  if (await adminCookieValid(req)) return null;

  /* Mode Cloudflare: kredensial DB tidak diakui — 401 polos tanpa lookup DB. */
  if (await envModeActive()) {
    return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  }

  const configured = await adminConfigured();
  if (!configured) {
    return NextResponse.json(
      { error: "Admin belum disiapkan. Buka halaman /admin untuk pengaturan awal." },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
}

/** Opsi cookie sesi yang seragam untuk login & setup */
export function adminCookieOptions(maxAgeSeconds = 60 * 60 * 12) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
