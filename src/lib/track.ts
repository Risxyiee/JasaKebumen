"use client";

/**
 * Sinyal klik tombol WhatsApp — KPI utama PRD
 * ("Jumlah klik tombol Hubungi via WhatsApp").
 *
 * Dipanggil saat anchor wa.me diklik; tidak boleh memperlambat atau
 * menggagalkan navigasi utama ke WhatsApp:
 *  - Prioritas navigator.sendBeacon (diproses setelah navigasi)
 *  - Fallback fetch dengan keepalive:true
 *  - Kegagalan tracking DIBIARKAN senyap — pengalaman user nomor satu
 */
export function trackWaClick(
  providerId: string,
  source: "direktori" | "profil"
): void {
  try {
    const body = JSON.stringify({ providerId, source });

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/track", blob)) return;
    }

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* tracking gagal → abaikan */
  }
}
