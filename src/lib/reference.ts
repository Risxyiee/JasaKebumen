/**
 * Data referensi kanonis kategori & kecamatan (client-safe, tanpa import DB).
 *
 * ID dibuat deterministik (`cat:<slug>` / `kec:<slug>`) supaya:
 *  - fallback saat DB gagal tetap konsisten dengan isi DB yang di-seed otomatis
 *  - form /daftar tidak pernah "stuck" — selalu ada pilihan yang valid
 */

export interface RefCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface RefDistrict {
  id: string;
  name: string;
  slug: string;
}

export const catId = (slug: string) => `cat:${slug}`;
export const kecId = (slug: string) => `kec:${slug}`;
export const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

export const REF_CATEGORIES: RefCategory[] = [
  /* Kategori produk UMKM (fokus PRD: Kuliner, Fashion/Batik, Kerajinan) */
  { id: catId("kuliner"), name: "Kuliner & makanan khas", slug: "kuliner", icon: "utensils" },
  { id: catId("fashion-batik"), name: "Fashion & batik", slug: "fashion-batik", icon: "shirt" },
  { id: catId("kerajinan"), name: "Kerajinan & kriya", slug: "kerajinan", icon: "shapes" },
  /* Kategori jasa (Fase awal JasaKebumen) */
  { id: catId("servis-ac"), name: "Servis AC & elektronik", slug: "servis-ac", icon: "air-vent" },
  { id: catId("servis-laptop"), name: "Servis laptop & HP", slug: "servis-laptop", icon: "laptop" },
  { id: catId("rental-mobil"), name: "Rental & cuci mobil", slug: "rental-mobil", icon: "car" },
  { id: catId("cleaning-laundry"), name: "Cleaning service & laundry", slug: "cleaning-laundry", icon: "sparkles" },
  { id: catId("fotografer"), name: "Fotografer & video", slug: "fotografer", icon: "camera" },
  { id: catId("tukang-listrik"), name: "Tukang listrik & CCTV", slug: "tukang-listrik", icon: "zap" },
  { id: catId("tukang-renovasi"), name: "Tukang & renovasi rumah", slug: "tukang-renovasi", icon: "hammer" },
  { id: catId("barbershop"), name: "Barbershop & salon", slug: "barbershop", icon: "scissors" },
  /* Kategori B2B (PRD: Pojok Kemasan & Desain) */
  { id: catId("kemasan-packaging"), name: "Kemasan & packaging", slug: "kemasan-packaging", icon: "package" },
  { id: catId("desain-grafis"), name: "Desain grafis & branding", slug: "desain-grafis", icon: "pen-tool" },
];

/* 26 kecamatan resmi Kabupaten Kebumen (sesuai Permendagri 137/2017 —
   PRD juga mensyaratkan "26 kecamatan"). Daftar lama memuat 3 nama yang
   keliru: Panjer (desa di Kec. Kebumen), Somagede & Kalibangkang
   (kecamatan Kab. Banyumas). */
export const REF_DISTRICT_NAMES: string[] = [
  "Kebumen", "Gombong", "Karanganyar", "Kutowinangun", "Prembun",
  "Sruweng", "Petanahan", "Puring", "Klirong", "Buluspesantren", "Alian",
  "Pejagoan", "Adimulyo", "Poncowarno", "Rowokele", "Ambal", "Kuwarasan",
  "Mirit", "Bonorowo", "Sadang", "Buayan", "Ayah", "Sempor",
  "Karangsambung", "Karanggayam", "Padureso",
];

export const REF_DISTRICTS: RefDistrict[] = REF_DISTRICT_NAMES.map((name) => {
  const slug = slugify(name);
  return { id: kecId(slug), name, slug };
});
