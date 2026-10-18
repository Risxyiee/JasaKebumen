import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Asterisk,
  BadgeCheck,
  MessageCircle,
  ShieldCheck,
  Star,
  Timer,
  Wallet,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PhotoGallery from "@/components/PhotoGallery";
import ReviewForm from "@/components/ReviewForm";
import ShareButton from "@/components/ShareButton";
import Reveal from "@/components/Reveal";
import { initials, toWaIntl } from "@/lib/data";
import { db } from "@/lib/db";
import { ensureDb } from "@/lib/db-bootstrap";

/* Profil selalu segar — approve admin langsung terlihat. Jangan prerender. */
export const dynamic = "force-dynamic";

const SITE = "https://jasakebumen.id";

async function getProvider(id: string) {
  try {
    const ready = await ensureDb();
    if (!ready) return null;
    return await db.provider.findFirst({
      where: { id, status: "published" },
      include: {
        category: { select: { name: true } },
        district: { select: { name: true } },
        reviews: {
          where: { status: "published" },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, name: true, rating: true, comment: true, createdAt: true },
        },
      },
    });
  } catch (error) {
    console.error("[profile] DB error:", error);
    return null;
  }
}

async function getRelated(categoryId: string, excludeId: string) {
  try {
    const rows = await db.provider.findMany({
      where: { categoryId, status: "published", id: { not: excludeId } },
      include: { category: { select: { name: true } }, district: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      cat: r.category.name,
      district: r.district.name,
      images: r.images || [],
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await getProvider(id);
  if (!p) return { title: "Profil usaha tidak ditemukan — JasaKebumen" };

  const title = `${p.name} — ${p.category.name}, Kec. ${p.district.name} | JasaKebumen`;
  const description =
    (p.description || `Layanan ${p.category.name.toLowerCase()} di Kec. ${p.district.name}, Kabupaten Kebumen.`).slice(0, 158);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/usaha/${p.id}`,
      siteName: "JasaKebumen",
      locale: "id_ID",
      type: "website",
      images: p.images.length
        ? [{ url: `/api/providers/${p.id}/images/0` }]
        : [{ url: "/og.png", width: 1200, height: 630 }],
    },
  };
}

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rating ${value.toFixed(1)} dari 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${(Math.round(value) >= n)
            ? "fill-amber-400 text-amber-400"
            : "text-stone-300"}`}
        />
      ))}
    </span>
  );
}

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = await getProvider(id);
  if (!provider) notFound();

  const related = await getRelated(provider.categoryId, provider.id);

  const count = provider.reviews.length;
  const avg = count > 0 ? provider.reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  const waNumber = toWaIntl(provider.whatsappNumber);
  const waMsg = `Halo ${provider.name}, saya menemukan usaha Anda di JasaKebumen. Boleh tanya-tanya layanan Anda?`;
  const profileUrl = `${SITE}/usaha/${provider.id}`;

  /* JSON-LD LocalBusiness — catatan: nomor WhatsApp SENGAJA tidak disertakan
     sebagai `telephone` (keputusan privasi; nomor hanya lewat tombol WhatsApp). */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: provider.name,
    description:
      provider.description ||
      `Layanan ${provider.category.name} di Kec. ${provider.district.name}, Kabupaten Kebumen.`,
    url: profileUrl,
    "@id": profileUrl,
    image: provider.images.length
      ? `${SITE}/api/providers/${provider.id}/images/0`
      : `${SITE}/og.png`,
    address: {
      "@type": "PostalAddress",
      addressLocality: provider.district.name,
      addressRegion: "Jawa Tengah",
      addressCountry: "ID",
    },
    areaServed: { "@type": "AdministrativeArea", name: "Kabupaten Kebumen" },
    ...(count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avg.toFixed(1),
            reviewCount: count,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };

  return (
    <main className="min-h-screen bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mute" aria-label="Breadcrumb">
          <Link href="/" className="inline-flex items-center gap-1.5 transition hover:text-green">
            <ArrowLeft className="h-4 w-4" /> Beranda
          </Link>
          <span className="text-faint">/</span>
          <Link href="/#penyedia" className="transition hover:text-green">Direktori</Link>
          <span className="text-faint">/</span>
          <span className="truncate font-medium text-ink">{provider.name}</span>
        </nav>

        {/* Kartu profil */}
        <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] md:gap-12">
          {/* Kiri: galeri */}
          <div>
            <PhotoGallery
              images={provider.images.map((_, i) => `/api/providers/${provider.id}/images/${i}`)}
              name={provider.name}
              initialsText={initials(provider.name)}
            />
          </div>

          {/* Kanan: identitas + CTA */}
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              <Asterisk className="h-3 w-3 text-amber-500" /> Profil usaha terverifikasi
            </p>
            <h1 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
              {provider.name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mute">
              <span className="inline-flex items-center gap-1.5 font-medium text-green">
                <BadgeCheck className="h-4 w-4" /> Terverifikasi
              </span>
              <span>·</span>
              <span>{provider.category.name}</span>
              <span>·</span>
              <span>Kec. {provider.district.name}</span>
            </p>

            {/* Ringkasan rating */}
            <div className="mt-4 flex items-center gap-2">
              {count > 0 ? (
                <>
                  <Stars value={avg} />
                  <span className="text-sm font-semibold text-ink">{avg.toFixed(1)}</span>
                  <span className="text-sm text-faint">
                    ({count} ulasan{count === 1 ? "" : ""})
                  </span>
                </>
              ) : (
                <span className="rounded border border-amber-500/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-600">
                  Mitra baru — belum ada ulasan
                </span>
              )}
            </div>

            {provider.description && (
              <p className="mt-5 whitespace-pre-line leading-relaxed text-mute">
                {provider.description}
              </p>
            )}

            {/* Jaminan layanan */}
            <ul className="mt-6 space-y-2.5 text-sm text-mute">
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-green" />
                Dikurasi langsung oleh tim JasaKebumen sebelum tayang
              </li>
              <li className="flex items-center gap-2.5">
                <Timer className="h-4 w-4 shrink-0 text-green" />
                Hubungi langsung — respon cepat via WhatsApp
              </li>
              <li className="flex items-center gap-2.5">
                <Wallet className="h-4 w-4 shrink-0 text-green" />
                Tanpa komisi per transaksi — harga diatur langsung
              </li>
            </ul>

            {/* CTA */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-green px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-dark"
              >
                <MessageCircle className="h-4 w-4" /> Chat WhatsApp
              </a>
              <ShareButton url={`/usaha/${provider.id}`} title={provider.name} />
            </div>
            <p className="mt-2.5 text-xs text-faint">
              Nomor WhatsApp pemilik tidak dipublikasikan di halaman ini —
              terhubung hanya lewat tombol chat.
            </p>
          </div>
        </div>

        {/* Ulasan */}
        <section id="ulasan" className="mt-16 border-t border-line pt-10">
          <Reveal>
            <h2 className="font-serif text-2xl text-ink md:text-3xl">Ulasan pelanggan</h2>
            {count > 0 && (
              <p className="mt-2 flex items-center gap-2 text-sm text-mute">
                <Stars value={avg} /> {avg.toFixed(1)} dari 5 · {count} ulasan terverifikasi
              </p>
            )}
          </Reveal>

          {count > 0 ? (
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {provider.reviews.map((r, i) => (
                <Reveal key={r.id} delay={Math.min(i, 5) * 0.05}>
                  <article className="h-full rounded-xl border border-line bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-green-tint text-xs font-bold text-green">
                          {initials(r.name)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-ink">{r.name}</p>
                          <p className="text-[11px] text-faint">
                            {new Date(r.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric", month: "long", year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <Stars value={r.rating} size="h-3.5 w-3.5" />
                    </div>
                    {r.comment && (
                      <p className="mt-3 text-sm leading-relaxed text-mute">{r.comment}</p>
                    )}
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-mute">
              Belum ada ulasan untuk usaha ini. Pernah dilayani? Tulis ulasan
              pertamamu — ulasan membantu pelanggan lain memilih dengan percaya diri.
            </p>
          )}

          <ReviewForm providerId={provider.id} />
        </section>

        {/* Usaha lain di kategori yang sama */}
        {related.length > 0 && (
          <section className="mt-14 border-t border-line pt-10">
            <h2 className="font-serif text-xl text-ink md:text-2xl">
              Usaha lain di kategori {provider.category.name}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/usaha/${r.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-white p-4 transition hover:border-green/30 hover:shadow-sm"
                >
                  {r.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/providers/${r.id}/images/0`}
                      alt={`Foto usaha ${r.name}`}
                      loading="lazy"
                      className="h-12 w-12 shrink-0 rounded-lg border border-green/10 object-cover"
                    />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-green-tint text-sm font-semibold text-green">
                      {initials(r.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink group-hover:text-green">
                      {r.name}
                    </p>
                    <p className="truncate text-xs text-mute">Kec. {r.district}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}
