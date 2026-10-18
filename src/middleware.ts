import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieValid, basicAuthValid, expectedAdminToken } from "@/lib/admin-auth";

/**
 * Perlindungan:
 *  - /admin/*                  → Basic auth (browser popup) + cookie sesi
 *  - /api/providers/status/*   → POST/PATCH/DELETE admin-only (publish/reject)
 *  - /api/providers            → GET admin-only; POST tetap PUBLIK (formulir /daftar)
 *
 * Catatan: middleware adalah lapisan pertama. Route handler admin juga
 * memanggil requireAdmin() sendiri (defense in depth).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* Formulir pendaftaran mitra — publik, tanpa auth */
  if (pathname === "/api/providers" && req.method === "POST") {
    return NextResponse.next();
  }

  const token = await expectedAdminToken();

  /* Belum dikonfigurasi → tolak semua akses admin (fail closed) */
  if (!token) {
    return new NextResponse("Admin belum dikonfigurasi.", { status: 503 });
  }

  if (basicAuthValid(req) || (await adminCookieValid(req))) {
    const res = NextResponse.next();
    /* Set/refresh cookie sesi — dipakai fetch() dari halaman admin */
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return res;
  }

  /* Halaman /admin → challenge Basic auth (popup browser) */
  if (pathname.startsWith("/admin")) {
    return new NextResponse(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="JasaKebumen Admin", charset="UTF-8"',
      },
    });
  }

  /* API admin → 401 JSON polos (tanpa popup) */
  return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
}

export const config = {
  matcher: ["/admin/:path*", "/api/providers", "/api/providers/status/:path*"],
};
