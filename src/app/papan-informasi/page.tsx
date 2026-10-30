import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Asterisk,
  BadgeCheck,
  FileText,
  GraduationCap,
  Landmark,
  Package,
  ShieldCheck,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { waAdminLink } from "@/lib/data";

export const metadata: Metadata = {
  title: "Papan Informasi Program — JasaKebumen",
  description:
    "Kumpulan program pendampingan UMKM Kebumen: sertifikasi halal, NIB/OSS, akses permodalan (KUR, LPDB, PNM), dan pelatihan dari dinas terkait.",
  openGraph: {
    title: "Papan Informasi Program UMKM Kebumen — JasaKebumen",
    description:
      "Sertifikasi halal, NIB, permodalan, dan pelatihan — dirangkum jadi satu halaman untuk pelaku usaha Kebumen.",
    url: "/papan-informasi",
    siteName: "JasaKebumen",
    locale: "id_ID",
    type: "website",
  },
};

interface Program {
  icon: typeof FileText;
  tag: string;
  title: string;
  for: string;
  points: string[];
  link?: { label: string; href: string };
}

/* Konten dirangkum dari program nasional yang berjalan resmi.
   Semua penjelasan bersifat umum — verifikasi persyaratannya ke
   portal/dinas yang bersangkutan sebelum mendaftar. */
const PROGRAMS: Program[] = [
  {
    icon: ShieldCheck,
    tag: "Sertifikasi",
    title: "Sertifikasi Halal (self-declare)",
    for: "Pelaku usaha makanan, minuman, dan bahan baku",
    points: [
      "Bebas biaya untuk usaha mikro-kecil lewat jalur self-declare (proses bimbingan lewat P3H/BPJPH).",
      "Dokumen utama: KTP, NIB, daftar produk beserta bahan-bahannya.",
      "Logo halal boleh dipakai setelah sertifikat terbit — menambah kepercayaan pembeli.",
    ],
    link: { label: "bpjph.halal.go.id", href: "https://bpjph.halal.go.id" },
  },
  {
    icon: FileText,
    tag: "Legalitas",
    title: "NIB & perizinan via OSS",
    for: "Semua usaha yang belum punya legalitas dasar",
    points: [
      "Nomor Induk Berusaha diterbitkan gratis lewat OSS (Online Single Submission) — cukup satu akun.",
      "NIB jadi syarat umum untuk pinjaman modal, ikut pameran, dan sertifikasi lain.",
      "Kebanyakan usaha mikro cukup pakai KTP dan NPWP pribadi untuk mulai.",
    ],
    link: { label: "oss.go.id", href: "https://oss.go.id" },
  },
  {
    icon: Landmark,
    tag: "Permodalan",
    title: "KUR, LPDB & pinjaman usaha mikro",
    for: "Usaha produktif yang butuh tambahan modal kerja",
    points: [
      "KUR (Kredit Usaha Rakyat): pinjaman berbunga rendah untuk usaha produktif, diajukan lewat bank/mitra bayar yang ditunjuk.",
      "LPDB-KUMKM: fasilitas pembiayaan revolving dari pemerintah untuk koperasi & UMKM.",
      "Siapkan NIB, catatan penjualan sederhana, dan foto produk — ini tiga hal yang paling sering diminta bank.",
    ],
  },
  {
    icon: GraduationCap,
    tag: "Pelatihan",
    title: "Pelatihan & pendampingan dinas",
    for: "Pelaku usaha yang ingin naik kelas",
    points: [
      "Dinas terkait Kabupaten Kebumen rutin membuka bimbingan pengemasan, desain produk, dan pembukuan sederhana.",
      "Ikut program dinas juga membuka kesempatan ikut pameran dan bazar yang dibiayai pemerintah.",
      "Pantau pengumuman resmi Kabupaten Kebumen atau tanyakan lewat admin JasaKebumen — kami rangkum di papan ini.",
    ],
  },
];

export default function PapanInformasiPage() {
  return (
    <main className="min-h-screen bg-paper">
      <Header />

      <div className="mx-auto max-w-4xl px-5 py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mute" aria-label="Breadcrumb">
          <Link href="/" className="inline-flex items-center gap-1.5 transition hover:text-green">
            <ArrowUpRight className="h-4 w-4 -scale-y-100" /> Beranda
          </Link>
          <span className="text-faint">/</span>
          <span className="truncate font-medium text-ink">Papan informasi</span>
        </nav>

        <Reveal>
          <p className="mt-8 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            <Asterisk className="h-3 w-3 text-amber-500" />
            Papan Informasi Program
          </p>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
            Program bantuan &amp; pelatihan{" "}
            <em className="italic text-green">untuk usaha Kebumen.</em>
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-mute">
            Pemerintah punya banyak program untuk UMKM — sertifikasi, legalitas,
            sampai permodalan — tapi infonya tersebar. Kami rangkum yang paling
            sering dibutuhkan pelaku usaha Kebumen di satu halaman ini, gratis.
          </p>
        </Reveal>

        {/* Kartu program */}
        <div className="mt-10 space-y-5">
          {PROGRAMS.map((p, i) => (
            <Reveal key={p.title} delay={Math.min(i, 5) * 0.05}>
              <article className="rounded-2xl border border-line bg-surface p-6 md:p-8">
                <div className="flex flex-col gap-5 md:flex-row">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-tint">
                    <p.icon className="h-6 w-6 text-green" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                      {p.tag}
                    </p>
                    <h2 className="mt-1 font-serif text-xl text-ink md:text-2xl">
                      {p.title}
                    </h2>
                    <p className="mt-1 text-sm text-mute">
                      Untuk: {p.for}
                    </p>
                    <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-mute">
                      {p.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5">
                          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                    {p.link && (
                      <a
                        href={p.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green underline underline-offset-4 transition hover:text-green-dark"
                      >
                        Portal resmi: {p.link.label} <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Catatan + CTA */}
        <Reveal>
          <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
            Rangkuman di halaman ini bersifat umum dan bukan pengumuman resmi.
            Persyaratan &amp; jadwal tiap program bisa berubah — selalu cek
            portal resmi atau dinas terkait sebelum mendaftar.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-green p-6 text-black">
              <h3 className="font-serif text-xl">Punya usaha di Kebumen?</h3>
              <p className="mt-2 text-sm leading-relaxed text-black/70">
                Daftarkan usahamu ke direktori — gratis, dikurasi tim, dan
                pembeli menghubungi WhatsApp-mu langsung tanpa komisi.
              </p>
              <Link
                href="/daftar"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-surface px-4 py-2.5 text-sm font-semibold text-green transition hover:bg-neutral-800"
              >
                Daftarkan usaha <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="flex items-center gap-2 font-serif text-xl text-ink">
                <Package className="h-5 w-5 text-green" /> Pojok Kemasan &amp; Desain
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">
                Butuh kemasan lebih rapi atau desain label untuk produkmu? Cari
                vendor lokal di halaman kolaborasi B2B kami.
              </p>
              <Link
                href="/kemasan-desain"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-green/30 px-4 py-2.5 text-sm font-semibold text-green transition hover:bg-green hover:text-black"
              >
                Buka Pojok Kemasan <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-mute">
            Ada program yang sebaiknya masuk papan ini?{" "}
            <a
              href={waAdminLink(
                "Halo Admin JasaKebumen, saya mau menyampaikan info program untuk Papan Informasi."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-green underline underline-offset-4 transition hover:text-green-dark"
            >
              Sampaikan lewat WhatsApp admin
            </a>
            .
          </p>
        </Reveal>
      </div>

      <Footer />
    </main>
  );
}
