import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Asterisk, BadgeCheck, Package, PenTool } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import WaChatButton from "@/components/WaChatButton";
import { initials, toWaIntl } from "@/lib/data";
import { db } from "@/lib/db";
import { ensureDb } from "@/lib/db-bootstrap";

/* Data vendor harus segar — force-dynamic, jangan dieksekusi saat build. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pojok Kemasan & Desain — JasaKebumen",
  description:
    "Vendor lokal penyedia jasa kemasan (packaging), label, dan desain grafis untuk tampilan produk UMKM Kebumen — hubungi langsung via WhatsApp.",
  openGraph: {
    title: "Pojok Kemasan & Desain untuk UMKM Kebumen — JasaKebumen",
    description:
      "Cari vendor kemasan, label, dan desain grafis lokal — kolaborasi B2B antar pelaku usaha Kebumen.",
    url: "/kemasan-desain",
    siteName: "JasaKebumen",
    locale: "id_ID",
    type: "website",
  },
};

/* Slug kategori B2B (Pojok Kemasan & Desain — PRD Fitur B.1) */
const B2B_SLUGS = ["kemasan-packaging", "desain-grafis"];

type B2bVendor = {
  id: string;
  name: string;
  description: string;
  address: string;
  verified: boolean;
  images: string[];
  waClicks: number;
  categoryName: string;
  districtName: string;
  waNumber: string;
};

async function getVendors(): Promise<B2bVendor[]> {
  try {
    const ready = await ensureDb();
    if (!ready) return [];

    const rows = await db.provider.findMany({
      where: {
        status: "published",
        category: { slug: { in: B2B_SLUGS } },
      },
      include: { category: { select: { name: true } }, district: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      address: r.address,
      verified: r.verified,
      images: r.images || [],
      waClicks: r.waClicks,
      categoryName: r.category.name,
      districtName: r.district.name,
      waNumber: toWaIntl(r.whatsappNumber),
    }));
  } catch (error) {
    console.error("[kemasan-desain] DB error:", error);
    return [];
  }
}

export default async function KemasanDesainPage() {
  const vendors = await getVendors();

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
          <span className="truncate font-medium text-ink">Pojok Kemasan &amp; Desain</span>
        </nav>

        <Reveal>
          <p className="mt-8 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            <Asterisk className="h-3 w-3 text-amber-500" />
            Kolaborasi B2B
          </p>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
            Pojok <em className="italic text-green">Kemasan &amp; Desain.</em>
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-mute">
            Produk bagus layak dikemas yang bagus. Halaman ini menghubungkan
            pelaku UMKM dengan vendor lokal: pembuatan kemasan, label, dus,
            sampai desain logo dan branding — langsung chat WhatsApp, tanpa
            perantara.
          </p>
        </Reveal>

        {/* Daftar vendor */}
        {vendors.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {vendors.map((v, i) => (
              <Reveal key={v.id} delay={Math.min(i, 5) * 0.05}>
                <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6">
                  <div className="flex items-start gap-3">
                    {v.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/providers/${v.id}/images/0`}
                        alt={`Foto usaha ${v.name}`}
                        loading="lazy"
                        className="h-12 w-12 shrink-0 rounded-lg border border-green/10 object-cover"
                      />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-green-tint text-sm font-semibold text-green">
                        {initials(v.name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="truncate font-semibold tracking-tight text-ink">
                          <Link href={`/usaha/${v.id}`} className="transition hover:text-green">
                            {v.name}
                          </Link>
                        </h2>
                        {v.verified && (
                          <BadgeCheck className="h-4 w-4 shrink-0 text-green" aria-label="Terverifikasi" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-mute">
                        {v.categoryName} · Kec. {v.districtName}
                      </p>
                    </div>
                  </div>

                  {v.description && (
                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-mute">
                      {v.description}
                    </p>
                  )}
                  {v.address && (
                    <p className="mt-2 text-xs text-faint">Lokasi: {v.address}</p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <WaChatButton
                      providerId={v.id}
                      source="direktori"
                      label="Chat vendor"
                      className="inline-flex items-center gap-2 rounded-lg border border-green/30 px-4 py-2 text-sm font-semibold text-green transition hover:border-green hover:bg-green hover:text-black"
                      href={`https://wa.me/${v.waNumber}?text=${encodeURIComponent(
                        `Halo ${v.name}, saya menemukan jasa Anda di Pojok Kemasan & Desain JasaKebumen. Boleh tanya-tanya?`
                      )}`}
                    />
                    <Link
                      href={`/usaha/${v.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-medium text-mute transition hover:border-green/30 hover:text-green"
                    >
                      Profil <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="mt-10 rounded-2xl border border-dashed border-line bg-surface py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-tint">
                <Package className="h-7 w-7 text-green" />
              </div>
              <p className="mt-4 font-serif text-2xl text-ink">
                Daftar vendor masih kosong.
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mute">
                Punya usaha kemasan, printing, atau jasa desain di Kebumen?
                Jadi vendor pertama yang tayang di sini — pendaftaran gratis,
                pilih kategori <strong>Kemasan &amp; packaging</strong> atau{" "}
                <strong>Desain grafis &amp; branding</strong>.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/daftar"
                  className="inline-flex items-center gap-2 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark"
                >
                  Daftarkan jasa Anda <PenTool className="h-4 w-4" />
                </Link>
                <Link
                  href="/papan-informasi"
                  className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-mute transition hover:border-green/30 hover:text-green"
                >
                  Lihat program pendampingan
                </Link>
              </div>
            </div>
          </Reveal>
        )}

        {/* CTA bawah */}
        {vendors.length > 0 && (
          <Reveal>
            <div className="mt-10 rounded-2xl border border-line bg-surface p-6 text-center md:p-8">
              <p className="font-serif text-xl text-ink">
                Punya usaha kemasan atau desain?
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mute">
                Tayang di halaman ini membuka pesanan B2B dari ratusan UMKM
                yang tiap hari mencari mitra kemasan — daftar gratis.
              </p>
              <Link
                href="/daftar"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark"
              >
                Daftarkan jasa Anda — gratis <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        )}
      </div>

      <Footer />
    </main>
  );
}
