import { ArrowUpRight, Asterisk } from "lucide-react";
import Header from "@/components/Header";
import DirectoryExperience from "@/components/DirectoryExperience";
import HowItWorks from "@/components/HowItWorks";
import Benefits from "@/components/Benefits";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import CsChat from "@/components/CsChat";
import RevealObserver from "@/components/RevealObserver";
import { SearchProvider } from "@/components/search-context";
import { waAdminLink, toWaIntl, type DirectoryProvider } from "@/lib/data";
import { logDbFailure } from "@/lib/db-bootstrap";
import { db } from "@/lib/db";
import { ensureDb } from "@/lib/db-bootstrap";

/* Direktori harus selalu segar — mitra baru yang di-approve admin langsung tayang.
   force-dynamic: jangan pernah dieksekusi/di-prerender saat build (DB belum pasti ada). */
export const dynamic = "force-dynamic";

type ProviderRow = {
  id: string;
  name: string;
  description: string;
  whatsappNumber: string;
  images: string[];
  verified: boolean;
  category: { name: string };
  district: { name: string };
};

/** Provider DB → bentuk tampilan direktori. Rating dari ulasan asli yang
    sudah di-approve admin (null = belum ada ulasan → tampil "Mitra baru"). */
function toDirectoryProvider(
  p: ProviderRow,
  avgRating?: number,
  reviewCount?: number
): DirectoryProvider {
  const reviews = reviewCount ?? 0;
  return {
    id: p.id,
    name: p.name,
    cat: p.category.name,
    district: p.district.name,
    verified: p.verified, // badge Terverifikasi — hanya usaha yang sudah dicek langsung admin
    rating: reviews > 0 ? Math.round(avgRating! * 10) / 10 : null,
    reviews,
    price: "", // DB belum menyimpan tarif → baris menampilkan "hubungi"
    keywords: `${p.description} ${p.category.name} ${p.district.name}`.toLowerCase(),
    desc: (p.description || "").slice(0, 140), // teks kartu premium (opsional)
    wa: toWaIntl(p.whatsappNumber),
    msg: `Halo ${p.name}, saya menemukan usaha Anda di JasaKebumen. Boleh tanya-tanya layanan Anda?`,
    images: (p.images || []).map((_, i) => `/api/providers/${p.id}/images/${i}`),
  };
}

async function getHomeData(): Promise<{
  providers: DirectoryProvider[];
  catCounts: Record<string, number>;
}> {
  try {
    /* Pastikan skema & data referensi siap (self-healing untuk DB baru) */
    await ensureDb();

    const [rows, categories, reviewStats] = await Promise.all([
      db.provider.findMany({
        where: { status: "published" },
        include: { category: true, district: true },
        orderBy: { createdAt: "desc" },
      }),
      db.category.findMany({
        include: {
          _count: { select: { providers: { where: { status: "published" } } } },
        },
      }),
      /* Rating asli dari ulasan yang sudah di-approve admin */
      db.review.groupBy({
        by: ["providerId"],
        where: { status: "published" },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    const ratingMap = new Map(
      reviewStats.map((r) => [
        r.providerId,
        { avg: r._avg.rating ?? 0, count: r._count._all },
      ])
    );

    const catCounts: Record<string, number> = {};
    for (const c of categories) catCounts[c.name] = c._count.providers;

    return {
      providers: rows.map((p) => {
        const stat = ratingMap.get(p.id);
        return toDirectoryProvider(p, stat?.avg, stat?.count);
      }),
      catCounts,
    };
  } catch (error) {
    /* DB belum dikonfigurasi / tidak terjangkau → tampilkan situs kosong yang jujur,
       jangan 500. (Cek console Workers untuk detailnya.) logDbFailure otomatis
       menurunkan log jadi warn bila DATABASE_URL masih placeholder. */
    logDbFailure("Homepage", error);
    return { providers: [], catCounts: {} };
  }
}

export default async function Page() {
  const { providers, catCounts } = await getHomeData();

  return (
    <SearchProvider>
      <Header />
      <RevealObserver />
      <main className="min-h-screen">
        {/* Hero peta 3D + timeline kategori + grid direktori (state bersama) */}
        <DirectoryExperience providers={providers} catCounts={catCounts} />

        <HowItWorks />
        <Benefits />

        {/* CTA section */}
        <section id="daftar" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <div className="relative overflow-hidden rounded-2xl bg-green px-6 py-12 text-white md:p-16" data-reveal>
              <span aria-hidden className="pointer-events-none absolute -bottom-9 right-2 select-none font-serif italic leading-none text-white/[0.06] [font-size:9rem] md:[font-size:11rem]">
                gratis
              </span>

              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
                <Asterisk className="h-3.5 w-3.5 animate-[spin_14s_linear_infinite] text-amber-300" />
                Untuk pelaku UMKM &amp; usaha jasa
              </p>
              <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-tight md:text-[2.6rem]">
                Punya usaha di Kebumen? <em className="italic text-amber-300">Dapatkan pelanggan baru.</em>
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-white/70">
                Daftarkan usahamu, tim kami kurasi dan verifikasi, lalu profilmu tayang di direktori.
                Pembeli menghubungi WhatsApp-mu langsung — tanpa komisi per transaksi.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <a
                  href={waAdminLink("Halo Admin JasaKebumen, saya ingin mendaftarkan usaha.")}
                  target="_blank" rel="noopener noreferrer"
                  className="magnet inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-green transition-colors hover:bg-amber-50"
                >
                  Daftarkan usaha — gratis <ArrowUpRight className="h-4 w-4" />
                </a>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-[11px] font-bold ring-2 ring-green">AS</span>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/25 text-[11px] font-bold ring-2 ring-green">GJ</span>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/35 text-[11px] font-bold ring-2 ring-green">RL</span>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-400 text-[11px] font-bold text-green-dark ring-2 ring-green">+{Math.max(providers.length, 1)}</span>
                  </div>
                  <span className="font-mono text-xs text-white/50">mitra bergabung di JasaKebumen</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Faq />
      </main>
      <Footer />

      {/* CS bot widget (menangani FAQ + titip pesan + notif owner) */}
      <CsChat />
    </SearchProvider>
  );
}
