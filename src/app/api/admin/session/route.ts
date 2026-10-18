import { NextRequest, NextResponse } from "next/server";
import {
  adminCookieValid,
  basicAuthValid,
  expectedAdminToken,
  getDbAdmin,
} from "@/lib/admin-auth";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/session — status sesi untuk halaman /admin (PUBLIK).
 * Tidak membocorkan apa pun selain: apakah admin sudah dikonfigurasi
 * (env / DB) dan apakah request ini sudah terautentikasi.
 */
export async function GET(req: NextRequest) {
  const envConfigured = !!(await expectedAdminToken());
  const dbConfigured = !!(await getDbAdmin());
  const authed = basicAuthValid(req) || (await adminCookieValid(req));

  return NextResponse.json({ envConfigured, dbConfigured, authed });
}
