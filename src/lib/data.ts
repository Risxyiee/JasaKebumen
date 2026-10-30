export interface Provider {
  id: string;
  name: string;
  cat: string;
  district: string;
  rating: number | null; // null = mitra baru, belum ada ulasan
  reviews: number;
  price: string;
  keywords: string;
  wa: string;
  msg: string;
}

export type CategoryIcon =
  | "air-vent" | "laptop" | "car" | "sparkles"
  | "camera" | "hammer" | "scissors" | "zap"
  | "utensils" | "shirt" | "shapes" | "package" | "pen-tool";

export interface Category {
  n: string;
  label: string;
  count: number;
  q: string;
  icon: CategoryIcon;
  wide?: boolean;
  desc?: string;
}

/* 26 kecamatan resmi Kabupaten Kebumen — sudah diverifikasi terhadap
   Permendagri 137/2017 (PRD: filter berbasis 26 kecamatan). */
export const DISTRICTS: string[] = [
  "all", "Kebumen", "Gombong", "Karanganyar", "Kutowinangun", "Prembun",
  "Sruweng", "Petanahan", "Puring", "Klirong", "Buluspesantren", "Alian",
  "Pejagoan", "Adimulyo", "Poncowarno", "Rowokele", "Ambal", "Kuwarasan",
  "Mirit", "Bonorowo", "Sadang", "Buayan", "Ayah", "Sempor",
  "Karangsambung", "Karanggayam", "Padureso",
];

export const KECAMATAN_DIPETAKAN = DISTRICTS.length - 1;

export const PROVIDERS: Provider[] = [
  {
    id: "ac-sejahtera",
    name: "AC Sejahtera", cat: "Servis AC & elektronik", district: "Kebumen",
    rating: 4.9, reviews: 127, price: "Rp75.000",
    keywords: "servis ac cuci ac isi freon elektronik kulkas mesin cuci tv",
    wa: "6281270010001", // TODO: nomor mitra asli
    msg: "Halo AC Sejahtera, saya menemukan usaha Anda di JasaKebumen. Boleh tanya harga servis AC?",
  },
  {
    id: "laptopfix-karanganyar",
    name: "LaptopFix Karanganyar", cat: "Servis laptop & HP", district: "Karanganyar",
    rating: 4.8, reviews: 89, price: "Rp40.000",
    keywords: "servis laptop hp ganti lcd install ulang software mati total",
    wa: "6281270010002",
    msg: "Halo LaptopFix, laptop saya perlu dicek. Bisa dibantu?",
  },
  {
    id: "gombong-autocare",
    name: "Gombong AutoCare", cat: "Rental & cuci mobil", district: "Gombong",
    rating: 4.9, reviews: 156, price: "Rp50.000",
    keywords: "rental mobil lepas kunci sopir cuci mobil detailing antar jemput",
    wa: "6281270010003",
    msg: "Halo Gombong AutoCare, mau tanya harga rental mobil.",
  },
  {
    id: "bersihkilat",
    name: "BersihKilat", cat: "Cleaning service & laundry", district: "Kutowinangun",
    rating: 4.7, reviews: 64, price: "Rp15.000",
    keywords: "cleaning service laundry cuci sofa kasur karpet harian",
    wa: "6281270010004",
    msg: "Halo BersihKilat, mau tanya paket cuci sofa.",
  },
  {
    id: "ruang-lensa",
    name: "Ruang Lensa Studio", cat: "Fotografer & video", district: "Kebumen",
    rating: 5.0, reviews: 41, price: "Rp500.000",
    keywords: "fotografer video wedding pernikahan prewedding dokumentasi acara",
    wa: "6281270010005",
    msg: "Halo Ruang Lensa, mau tanya paket foto pernikahan.",
  },
  {
    id: "bangunan-jaya",
    name: "Bangunan Jaya", cat: "Tukang & renovasi rumah", district: "Gombong",
    rating: null, reviews: 0, price: "Rp120.000",
    keywords: "tukang bangunan renovasi rumah keramik genteng atap plesteran",
    wa: "6281270010006",
    msg: "Halo Bangunan Jaya, mau tanya jasa renovasi rumah.",
  },
  {
    id: "listrik-buwono",
    name: "Listrik Buwono", cat: "Tukang listrik & CCTV", district: "Prembun",
    rating: 4.8, reviews: 73, price: "Rp60.000",
    keywords: "tukang listrik instalasi kabel pasang cctv",
    wa: "6281270010007",
    msg: "Halo Listrik Buwono, mau tanya jasa pasang CCTV.",
  },
  {
    id: "kedai-gunting",
    name: "Kedai Gunting", cat: "Barbershop & salon", district: "Kebumen",
    rating: 4.6, reviews: 98, price: "Rp25.000",
    keywords: "barbershop salon potong rambut cukur panggilan",
    wa: "6281270010008",
    msg: "Halo Kedai Gunting, mau tanya layanan barbershop.",
  },
];

export const CATS: Category[] = [
  /* Produk UMKM (PRD Fase 1) */
  { n: "01", label: "Kuliner & makanan khas", count: 0, q: "kuliner", icon: "utensils", wide: true,
    desc: "Lanting, getuk, petis, sampai katering — langsung dari produsen." },
  { n: "02", label: "Fashion & batik", count: 0, q: "batik", icon: "shirt" },
  { n: "03", label: "Kerajinan & kriya", count: 0, q: "kerajinan", icon: "shapes" },
  { n: "04", label: "Servis AC & elektronik", count: 0, q: "servis ac", icon: "air-vent", wide: true,
    desc: "Cuci, isi freon, bongkar-pasang. Teknisi datang ke rumah." },
  { n: "05", label: "Servis laptop & HP", count: 0, q: "laptop", icon: "laptop" },
  { n: "06", label: "Rental & cuci mobil", count: 0, q: "rental mobil", icon: "car" },
  { n: "07", label: "Cleaning service & laundry", count: 0, q: "laundry", icon: "sparkles", wide: true,
    desc: "Sofa, kasur, karpet, dan laundry harian." },
  { n: "08", label: "Fotografer & video", count: 0, q: "fotografer", icon: "camera" },
  { n: "09", label: "Tukang listrik & CCTV", count: 0, q: "listrik", icon: "zap" },
  { n: "10", label: "Tukang & renovasi rumah", count: 0, q: "renovasi", icon: "hammer", wide: true,
    desc: "Keramik, atap, kamar mandi — tim tukang berpengalaman." },
  { n: "11", label: "Barbershop & salon", count: 0, q: "barbershop", icon: "scissors" },
  /* B2B (PRD: Pojok Kemasan & Desain) */
  { n: "12", label: "Kemasan & packaging", count: 0, q: "kemasan", icon: "package", wide: true,
    desc: "Kemasan produk, label, dan dus — vendor lokal untuk tampilan jualan lebih niat." },
  { n: "13", label: "Desain grafis & branding", count: 0, q: "desain", icon: "pen-tool" },
];

export const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/* ---------- Keterangan harga (tampilan menyesuaikan kategori usaha) ----------
   - Kuliner/F&B : harga sesuai foto (caption tiap foto = menu + harga)
                   + daftar harga menu (priceNote) + harga mulai.
   - Produk      : rentang harga (mulai–sampai).
   - Jasa        : harga mulai + keterangan tarif (per unit/jam).
   Helper di bawah dipakai bersama oleh kartu direktori & halaman profil. */

export const formatRupiah = (n: number): string => `Rp ${n.toLocaleString("id-ID")}`;

/** Label harga untuk kartu & baris direktori:
    min+maks → "Rp 10.000–25.000" · hanya min → "mulai Rp 10.000" · kosong → "". */
export const formatPriceLabel = (min?: number | null, max?: number | null): string => {
  const lo = typeof min === "number" && min > 0 ? min : null;
  const hi = typeof max === "number" && max > 0 ? max : null;
  if (lo && hi && hi > lo) return `${formatRupiah(lo)}–${formatRupiah(hi).replace("Rp ", "")}`;
  if (lo) return `mulai ${formatRupiah(lo)}`;
  if (hi) return formatRupiah(hi);
  return "";
};

export interface PriceLine {
  label: string;
  price: string; // "" bila baris tidak memuat angka harga
}

/** Ubah keterangan harga multi-baris ("Getuk lapis — Rp 10.000") menjadi
    pasangan nama–harga agar tampil rapi sebagai daftar di profil usaha.
    Baris tanpa harga tetap tampil sebagai teks biasa (price: ""). */
export const parsePriceLines = (note: string): PriceLine[] =>
  (note || "")
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean)
    .slice(0, 30)
    .map((line) => {
      // "Nama — Rp 13.000" / "Nama: Rp 13.000" / "Nama - Rp 13.000"
      const m = line.match(/^(.+?)\s*(?:[—–:]|\s-\s)\s*(Rp\.?\s?[\d.,]+.*)$/i);
      if (m) return { label: m[1].trim(), price: m[2].trim() };
      // "Nama Rp 13.000" (tanpa pemisah)
      const m2 = line.match(/^(.{3,}?)\s+(Rp\.?\s?[\d.,]+.*)$/i);
      if (m2) return { label: m2[1].trim(), price: m2[2].trim() };
      return { label: line, price: "" };
    });

/* ---------- Mapping Provider dari database → bentuk tampilan direktori ---------- */

export interface DirectoryProvider {
  id: string;
  name: string;
  cat: string;
  district: string;
  verified: boolean;
  rating: number | null;
  reviews: number;
  price: string; // label siap tampil, mis. "mulai Rp 10.000" — kosong = belum ada tarif → tampil "hubungi"
  keywords: string;
  desc?: string; // deskripsi singkat usaha (untuk kartu premium; opsional)
  wa: string; // format internasional tanpa "+", mis. 62812…
  msg: string;
  images?: string[]; // path foto usaha (maks 3), mis. /api/providers/<id>/images/0
}

/** Normalisasi nomor WA lokal ke format internasional tanpa "+" (untuk wa.me). */
export const toWaIntl = (raw: string): string => {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (!d.startsWith("62")) d = "62" + d;
  return d;
};

export const waLink = (p: Provider) =>
  `https://wa.me/${p.wa}?text=${encodeURIComponent(p.msg)}`;

/** Kontak admin — link undangan GRUP WhatsApp (bukan nomor pribadi,
    aman dari panenan scraper). Link undangan grup tidak mendukung teks
    otomatis, jadi argumen `text` diabaikan — dipertahankan supaya semua
    pemanggil lama tetap kompatibel tanpa diubah satu per satu. */
export const waAdminLink = (_text?: string) =>
  "https://chat.whatsapp.com/KGiXliUNrRm8KuLlkQjSOd";

export function directoryStats() {
  const rated = PROVIDERS.filter((p): p is Provider & { rating: number } => p.rating !== null);
  const rating = rated.length ? rated.reduce((s, p) => s + p.rating, 0) / rated.length : 0;
  const ulasan = PROVIDERS.reduce((s, p) => s + p.reviews, 0);
  return { mitra: PROVIDERS.length, kecamatan: KECAMATAN_DIPETAKAN, rating, ulasan };
}
