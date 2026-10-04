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
  | "camera" | "hammer" | "scissors" | "zap";

export interface Category {
  n: string;
  label: string;
  count: number;
  q: string;
  icon: CategoryIcon;
  wide?: boolean;
  desc?: string;
}

export const WA_ADMIN = "6281234567890"; // TODO: ganti nomor admin asli

export const DISTRICTS: string[] = [
  "all", "Kebumen", "Gombong", "Karanganyar", "Kutowinangun", "Prembun",
  "Sruweng", "Petanahan", "Puring", "Klirong", "Buluspesantren", "Alian",
  "Pejagoan", "Adimulyo", "Poncowarno", "Rowokele", "Ambal", "Kuwarasan",
  "Mirit", "Bonorowo", "Panjer", "Sadang", "Buayan", "Ayah", "Sempor",
  "Somagede", "Kalibangkang", "Karangsambung", "Karanggayam", "Padureso",
];

// TODO: verifikasi daftar kecamatan resmi Kabupaten Kebumen sebelum rilis
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
  { n: "01", label: "Servis AC & elektronik", count: 18, q: "servis ac", icon: "air-vent", wide: true,
    desc: "Cuci, isi freon, bongkar-pasang. Teknisi datang ke rumah." },
  { n: "02", label: "Servis laptop & HP", count: 24, q: "laptop", icon: "laptop" },
  { n: "03", label: "Rental & cuci mobil", count: 12, q: "rental mobil", icon: "car" },
  { n: "04", label: "Cleaning service & laundry", count: 21, q: "laundry", icon: "sparkles", wide: true,
    desc: "Sofa, kasur, karpet, dan laundry harian." },
  { n: "05", label: "Fotografer & video", count: 9, q: "fotografer", icon: "camera" },
  { n: "06", label: "Tukang listrik & CCTV", count: 14, q: "listrik", icon: "zap" },
  { n: "07", label: "Tukang & renovasi rumah", count: 31, q: "renovasi", icon: "hammer", wide: true,
    desc: "Keramik, atap, kamar mandi — tim tukang berpengalaman." },
  { n: "08", label: "Barbershop & salon", count: 17, q: "barbershop", icon: "scissors", wide: true,
    desc: "Potong rambut & cukur, juga melayani panggilan." },
];

export const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export const waLink = (p: Provider) =>
  `https://wa.me/${p.wa}?text=${encodeURIComponent(p.msg)}`;

export const waAdminLink = (text: string) =>
  `https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(text)}`;

export function directoryStats() {
  const rated = PROVIDERS.filter((p): p is Provider & { rating: number } => p.rating !== null);
  const rating = rated.length ? rated.reduce((s, p) => s + p.rating, 0) / rated.length : 0;
  const ulasan = PROVIDERS.reduce((s, p) => s + p.reviews, 0);
  return { mitra: PROVIDERS.length, kecamatan: KECAMATAN_DIPETAKAN, rating, ulasan };
}
