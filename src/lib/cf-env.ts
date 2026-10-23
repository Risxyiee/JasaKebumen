import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Akses aman ke env/binding Cloudflare Workers.
 *
 * getCloudflareContext() hanya valid di dalam request runtime Workers —
 * saat `next build` (prerender) atau dev lokal ia melempar error. Helper
 * ini menangkapnya dan mengembalikan objek kosong, sehingga semua fitur
 * yang bergantung binding (rate limit, Turnstile, analytics) degrade
 * terbuka dan tidak pernah menjatuhkan build maupun request.
 */
export function cfEnv(): Record<string, unknown> {
  try {
    const ctx = getCloudflareContext() as unknown as {
      env?: Record<string, unknown>;
    };
    return ctx?.env ?? {};
  } catch {
    return {};
  }
}

/** Ambil nilai string dari env Workers dengan fallback ke process.env. */
export function envString(name: string): string {
  const fromBinding = cfEnv()[name];
  if (typeof fromBinding === "string" && fromBinding.trim()) {
    return fromBinding.trim();
  }
  const fromProcess = process.env[name];
  return typeof fromProcess === "string" ? fromProcess.trim() : "";
}
