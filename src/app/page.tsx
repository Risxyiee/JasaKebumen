import { ArrowUpRight, Asterisk, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import CategoryGrid from "@/components/CategoryGrid";
import ProviderDirectory from "@/components/ProviderDirectory";
import HowItWorks from "@/components/HowItWorks";
import Benefits from "@/components/Benefits";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import { SearchProvider } from "@/components/search-context";
import { waAdminLink } from "@/lib/data";

export default function Page() {
  return (
    <SearchProvider>
      <Header />
      <main className="min-h-screen">
        <Hero />
        <Stats />
        <Features />
        <CategoryGrid />
        <ProviderDirectory />
        <HowItWorks />
        <Benefits />

        {/* CTA pemilik usaha */}
        <section id="daftar" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <div className="relative overflow-hidden rounded-2xl bg-green px-6 py-12 text-white md:p-16">
              <span aria-hidden className="pointer-events-none absolute -bottom-9 right-2 select-none font-serif italic leading-none text-white/[0.06] [font-size:9rem] md:[font-size:11rem]">
                gratis
              </span>
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
                <Asterisk className="h-3.5 w-3.5 animate-[spin_14s_linear_infinite] text-amber-300" />
                Untuk pemilik usaha jasa
              </p>
              <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-tight md:text-[2.6rem]">
                Punya usaha di Kebumen? <em className="italic text-amber-300">Dapatkan pelanggan baru.</em>
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-white/70">
                Daftarkan usahamu, tim kami kurasi dan verifikasi, lalu profilmu tayang di direktori.
                Pelanggan menghubungi WhatsApp-mu langsung — tanpa komisi per transaksi.
              </p>
              <div className="mt-8">
                <a
                  href={waAdminLink("Halo Admin JasaKebumen, saya ingin mendaftarkan usaha jasa.")}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-green transition-colors hover:bg-amber-50"
                >
                  Daftarkan usaha — gratis <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <Faq />
      </main>
      <Footer />

      {/* FAB WhatsApp */}
      <a
        href={waAdminLink("Halo Admin JasaKebumen, saya butuh bantuan.")}
        target="_blank" rel="noopener noreferrer" aria-label="Chat admin"
        className="fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center rounded-full bg-green text-white shadow-lg shadow-black/10 ring-1 ring-white/20 transition hover:bg-green-dark"
      >
        <MessageCircle className="h-5 w-5" />
      </a>
    </SearchProvider>
  );
}
