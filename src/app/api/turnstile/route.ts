import { NextResponse } from "next/server";
import { turnstileSiteKey } from "@/lib/turnstile";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/**
 * GET /api/turnstile — site key widget anti-bot untuk form publik.
 * Site key memang non-rahasia (tampak di HTML widget), tapi dikirim via
 * endpoint runtime agar tidak perlu variabel NEXT_PUBLIC_* (build time).
 * siteKey null → client tidak merender widget (Turnstile belum diaktifkan).
 */
export async function GET() {
  return NextResponse.json({ siteKey: turnstileSiteKey() || null });
}
