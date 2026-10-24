/**
 * Koordinat peta — FRONTEND ONLY (tidak mengubah schema/API backend).
 *
 * Provider di database belum menyimpan lat/lng; lokasi paling granular yang
 * dimiliki adalah kecamatan. Jadi setiap pin diposisikan di CENTROID
 * kecamatan + offset deterministik kecil (hash id usaha) supaya banyak mitra
 * dalam satu kecamatan tidak menumpuk di satu titik persis.
 *
 * Centroid ±150–400 m dari pusat keramaian tiap kecamatan — cukup akurat
 * untuk pin direktori level kecamatan (bukan navigasi alamat).
 */

export interface LngLat {
  lng: number;
  lat: number;
}

/** Centroid 26 kecamatan resmi Kabupaten Kebumen (Permendagri 137/2017). */
export const DISTRICT_COORDS: Record<string, LngLat> = {
  Kebumen: { lng: 109.6525, lat: -7.6705 },
  Gombong: { lng: 109.5222, lat: -7.6077 },
  Karanganyar: { lng: 109.5889, lat: -7.6464 },
  Kutowinangun: { lng: 109.5967, lat: -7.6639 },
  Prembun: { lng: 109.6392, lat: -7.6528 },
  Sruweng: { lng: 109.6383, lat: -7.6817 },
  Petanahan: { lng: 109.6325, lat: -7.7067 },
  Puring: { lng: 109.6189, lat: -7.7319 },
  Klirong: { lng: 109.6114, lat: -7.7444 },
  Buluspesantren: { lng: 109.5786, lat: -7.705 },
  Alian: { lng: 109.5936, lat: -7.6758 },
  Pejagoan: { lng: 109.6136, lat: -7.6736 },
  Adimulyo: { lng: 109.6603, lat: -7.7064 },
  Poncowarno: { lng: 109.5722, lat: -7.7006 },
  Rowokele: { lng: 109.5653, lat: -7.5936 },
  Ambal: { lng: 109.5394, lat: -7.7686 },
  Kuwarasan: { lng: 109.565, lat: -7.7389 },
  Mirit: { lng: 109.5119, lat: -7.7472 },
  Bonorowo: { lng: 109.4872, lat: -7.73 },
  Sadang: { lng: 109.5572, lat: -7.6869 },
  Buayan: { lng: 109.545, lat: -7.6356 },
  Ayah: { lng: 109.5231, lat: -7.5714 },
  Sempor: { lng: 109.6267, lat: -7.5739 },
  Karangsambung: { lng: 109.5967, lat: -7.6942 },
  Karanggayam: { lng: 109.5872, lat: -7.7192 },
  Padureso: { lng: 109.5531, lat: -7.6469 },
};

/** Pusat peta hero: kota Kebumen. */
export const MAP_CENTER: LngLat = { lng: 109.6445, lat: -7.6712 };

/* ---------- Offset deterministik (stabil antar-render) ---------- */

/** Hash string sederhana → uint32 (FNV-1a). */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Titik pin untuk satu usaha: centroid kecamatan + offset spiral deterministik.
 * Radius offset ~90–320 m (0.001°–0.0029°) — terlihat terpisah di zoom kota,
 * tetap "di kecamatan yang benar" saat zoom out.
 */
export function providerCoords(id: string, district: string): LngLat {
  const base = DISTRICT_COORDS[district] ?? MAP_CENTER;
  const h = hash32(id + "|" + district);
  const angle = ((h % 360) / 360) * Math.PI * 2;
  // Radius naik per-index hash supaya pin ke-N tidak menumpuk di pin ke-1
  const ring = (h >>> 8) % 100; // 0..99
  const radius = 0.0011 + (ring / 99) * 0.0018; // derajat (~0.12–0.33 km)
  return {
    lng: base.lng + Math.cos(angle) * radius,
    lat: base.lat + Math.sin(angle) * radius * 0.92, // sedikit pipih (lintang)
  };
}
