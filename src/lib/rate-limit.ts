import type { NextRequest } from "next/server";
import { cfEnv } from "./cf-env";

/**
 * Pembatas laju per-IP memakai Rate Limiting Binding Cloudflare — native,
 * gratis, tanpa state tambahan di DB.
 *
 * Cara kerja: satu binding (wrangler.toml: 15 permintaan / 10 detik) dipakai
 * bersama; bucket dibedakan lewat kunci `bucket:ip` sehingga hitungan form
 * daftar, ulasan, klik WA, chat, dan login saling terpisah.
 *
 * Kegagalan sengaja didesain FAIL-OPEN: di dev lokal atau saat binding
 * belum aktif, request DIBIARKAN lewat — lapisan anti-bot tetap dijaga
 * honeypot + Turnstile + moderasi admin, dan situs tidak boleh mati hanya
 * karena pembatas laju bermasalah.
 */

type RateLimiterBinding = {
  limit: (input: { key: string }) => Promise<{ success: boolean }>;
};

/** IP asli klien (diisi Cloudflare edge) — fallback generik bila tak ada. */
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * true = request boleh lanjut. `bucket` bebas, satu kata per endpoint:
 * "daftar" | "ulasan" | "klik-wa" | "chat" | "login".
 */
export async function allowRequest(
  req: NextRequest,
  bucket: string
): Promise<boolean> {
  const ip = clientIp(req);
  if (!ip || ip === "unknown") return true;

  try {
    const limiter = cfEnv().RATE_LIMITER as RateLimiterBinding | undefined;
    if (limiter && typeof limiter.limit === "function") {
      const result = await limiter.limit({ key: `${bucket}:${ip}` });
      return result?.success !== false;
    }
  } catch {
    /* runtime bukan Workers / binding error → izinkan */
  }
  return true;
}

/** Pesan 429 baku (Indonesia) untuk semua endpoint. */
export function tooMany(): { error: string } {
  return {
    error:
      "Terlalu banyak permintaan dari perangkat Anda. Tunggu ±10 detik lalu coba lagi.",
  };
}
