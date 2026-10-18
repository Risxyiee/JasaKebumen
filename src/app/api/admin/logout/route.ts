import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions } from "@/lib/admin-auth";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/** POST /api/admin/logout — hapus cookie sesi admin. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions(), maxAge: 0 });
  return res;
}
