import { envString } from "./cf-env";

/**
 * Cloudflare Turnstile — pemenuhan PRD §4 "proteksi formulir dari bot/spam"
 * (reCAPTCHA diimplementasi sebagai Turnstile: gratis, tanpa cookie iklan,
 * menyatu dengan stack Cloudflare Workers).
 *
 * Dua variabel OPSIONAL di dashboard Cloudflare — situs tetap jalan tanpanya:
 *  - TURNSTILE_SITE_KEY   → menampilkan widget di form publik (non-rahasia)
 *  - TURNSTILE_SECRET_KEY → verifikasi sisi server lewat siteverify API
 *
 * Aturan degrade yang aman:
 *  - SECRET tidak diset   → token tidak divalidasi (honeypot + rate limit
 *                           + moderasi admin yang tetap menjaga form).
 *  - SECRET diset         → token kosong/salah DITOLAK (403).
 *  - siteverify tak terjangkau → DIBIARKAN lewat (jangan pernah blokir
 *                           manusia hanya karena jaringan sempat error).
 */

/** Site key untuk widget client — non-rahasia, boleh dikirim ke browser. */
export function turnstileSiteKey(): string {
  return envString("TURNSTILE_SITE_KEY");
}

/**
 * Verifikasi token Turnstile dari form. Dipanggil di server (route handler)
 * sebelum menyimpan data. `ip` boleh kosong — hanya mempertajam penilaian.
 */
export async function verifyTurnstile(
  token: unknown,
  ip: string
): Promise<{ ok: boolean; configured: boolean }> {
  const secret = envString("TURNSTILE_SECRET_KEY");
  if (!secret) return { ok: true, configured: false };

  if (typeof token !== "string" || token.length < 10) {
    return { ok: false, configured: true };
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    );
    const data = (await res.json()) as { success?: boolean };
    return { ok: data?.success === true, configured: true };
  } catch {
    /* siteverify gagal dihubungi → izinkan, jangan gagalkan manusia */
    return { ok: true, configured: true };
  }
}

/** Pesan error baku bila verifikasi ditolak. */
export function turnstileRejected(): { error: string } {
  return {
    error:
      "Verifikasi keamanan gagal atau kedaluwarsa. Muat ulang halaman, selesaikan cek keamanan, lalu kirim lagi.",
  };
}
