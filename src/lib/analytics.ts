import { envString } from "./cf-env";

/**
 * Token Cloudflare Web Analytics (opsional) — pemenuhan KPI PRD di luar
 * klik WA: dari mana pengunjung datang dan halaman apa yang dilihat.
 *
 * Token dibaca SAAT REQUEST (bukan build time), jadi cukup diset sebagai
 * variabel `CLOUDFLARE_ANALYTICS_TOKEN` di dashboard Cloudflare lalu
 * redeploy — tanpa mengubah kode. Kosong → beacon tidak dirender sama
 * sekali (tanpa cookie, tanpa beban).
 */
export function analyticsToken(): string {
  return envString("CLOUDFLARE_ANALYTICS_TOKEN");
}
