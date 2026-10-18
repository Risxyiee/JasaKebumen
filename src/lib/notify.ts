/**
 * Notifikasi owner via Telegram (gratis, works on Cloudflare Workers —
 * cukup HTTPS outbound ke api.telegram.org).
 *
 * Setup sekali:
 *  1. Chat dengan @BotFather di Telegram → /newbot → ikuti langkahnya,
 *     salin token bot-nya.
 *  2. Chat dengan botmu sekali (kirim "halo") supaya chat terdaftar,
 *     lalu buka https://api.telegram.org/bot<TOKEN>/getUpdates —
 *     cari "chat":{"id":123456789} → itulah TELEGRAM_CHAT_ID-mu.
 *  3. Set di Cloudflare Dashboard → Workers → Settings → Variables:
 *     - TELEGRAM_BOT_TOKEN  (secret)
 *     - TELEGRAM_CHAT_ID    (secret)
 *
 * Jika belum diset → notifikasi dilewati diam-diam (inbox /admin tetap
 * berfungsi sebagai fallback). Fungsi ini TIDAK PERNAH melempar error.
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function tgEscape(s: string): string {
  return escapeHtml(s);
}

export async function sendTelegram(htmlText: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false; // notifikasi belum dikonfigurasi — skip

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("[telegram] gagal:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[telegram] error:", error);
    return false;
  }
}

const ADMIN_URL = "https://jasakebumen.id/admin";

/** Notif: pendaftaran usaha baru menunggu kurasi. */
export function notifyNewProvider(p: {
  name: string;
  categoryName: string;
  districtName: string;
  whatsappNumber: string;
  photoCount: number;
}): Promise<boolean> {
  return sendTelegram(
    [
      "<b>Pendaftar baru di JasaKebumen</b>",
      "",
      `Nama usaha: <b>${tgEscape(p.name)}</b>`,
      `Kategori: ${tgEscape(p.categoryName)}`,
      `Kecamatan: ${tgEscape(p.districtName)}`,
      `WA: ${tgEscape(p.whatsappNumber)}`,
      `Foto: ${p.photoCount}`,
      "",
      `Kurasi: ${ADMIN_URL}`,
    ].join("\n")
  );
}

/** Notif: ulasan baru menunggu moderasi. */
export function notifyNewReview(r: {
  providerName: string;
  reviewerName: string;
  rating: number;
  comment: string;
}): Promise<boolean> {
  return sendTelegram(
    [
      "<b>Ulasan baru di JasaKebumen</b>",
      "",
      `Untuk: <b>${tgEscape(r.providerName)}</b>`,
      `Nilai: ${r.rating}/5 oleh ${tgEscape(r.reviewerName)}`,
      `Komentar: "${tgEscape(r.comment)}"`,
      "",
      `Moderasi: ${ADMIN_URL}`,
    ].join("\n")
  );
}

/** Notif: pesan CS baru dari widget chat. */
export function notifyNewCsMessage(m: {
  name: string;
  contact: string;
  text: string;
}): Promise<boolean> {
  const ident =
    m.name || m.contact
      ? `Dari: <b>${tgEscape(m.name || "-")}</b>${m.contact ? ` (WA: ${tgEscape(m.contact)})` : ""}`
      : "Dari: pengunjung (tanpa kontak)";
  return sendTelegram(
    [
      "<b>Pesan CS baru di JasaKebumen</b>",
      "",
      ident,
      "",
      `"${tgEscape(m.text)}"`,
      "",
      `Inbox: ${ADMIN_URL}`,
    ].join("\n")
  );
}
