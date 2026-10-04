"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Search, ChevronDown, Star } from "lucide-react";
import { PROVIDERS, DISTRICTS, initials, type Provider } from "@/lib/data";
import { useSearch, scrollToDirectory } from "./search-context";
import WhatsAppButton from "./WhatsAppButton";

const featured = PROVIDERS[0];

const rise = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Hero() {
  const { query, setQuery, district, setDistrict } = useSearch();
  const reduce = useReducedMotion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scrollToDirectory();
  };

  return (
    <section id="hero" className="relative overflow-hidden bg-paper pb-16 pt-28 md:pb-24 md:pt-36">
      <span aria-hidden className="pointer-events-none absolute left-4 top-24 hidden select-none font-serif text-[11rem] leading-none text-green/[0.04] lg:block">01</span>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2 lg:gap-16">
        {/* ===== Copy ===== */}
        <div>
          <motion.p
            variants={rise} initial="hidden" animate="show"
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint"
          >
            <span className="text-amber-500">✳</span>01 — JasaKebumen
          </motion.p>

          <motion.h1
            variants={rise} initial="hidden" animate="show"
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 font-serif text-4xl leading-[1.1] md:text-5xl lg:text-[3.4rem]"
          >
            Cari &amp; panggil{" "}
            <span className="relative inline-block">
              <span className="relative z-10">jasa lokal</span>
              <span aria-hidden className="absolute -bottom-1 left-0 right-0 h-3 bg-amber-200/50" />
            </span>
            <br />
            Kebumen, langsung WhatsApp.
          </motion.h1>

          <motion.p
            variants={rise} initial="hidden" animate="show"
            transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-lg text-[15px] leading-relaxed text-mute"
          >
            Direktori teknisi, tukang, dan penyedia jasa terverifikasi di 28 kecamatan.
            Tanpa biaya, tanpa perantara — hubungi langsung lewat WhatsApp.
          </motion.p>

          {/* Search bar */}
          <motion.form
            variants={rise} initial="hidden" animate="show"
            onSubmit={handleSubmit}
            transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8"
          >
            <div className="flex flex-col items-stretch gap-2 rounded-xl border border-line bg-white p-1.5 shadow-[0_12px_40px_-12px_rgba(6,78,59,.15)] md:flex-row md:gap-0">
              <div className="flex items-center gap-2 px-3">
                <Search className="h-4 w-4 text-faint" />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text" aria-label="Cari jasa"
                placeholder="Butuh apa? Misal: servis AC, tukang listrik, fotografer"
                className="w-full bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-faint md:flex-1"
              />
              <div className="hidden w-px self-stretch bg-line md:block" />
              <div className="relative md:w-48">
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  aria-label="Kecamatan"
                  className="w-full appearance-none bg-transparent py-2.5 pl-3 pr-9 text-[15px] text-mute outline-none"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d === "all" ? "Semua kecamatan" : d}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-dark"
              >
                <Search className="h-4 w-4" /> Cari
              </button>
            </div>
          </motion.form>

          <motion.p
            variants={rise} initial="hidden" animate="show"
            className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-faint"
          >
            Gratis untuk pencari · Langsung WhatsApp · Mitra dikurasi tim
          </motion.p>
        </div>

        {/* ===== Live preview — pengganti diorama 3D ===== */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="lg:mt-12"
        >
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-32px_rgba(6,78,59,.28)]">
            {/* Mini map */}
            <div className="bg-grid relative h-52 sm:h-60">
              <span className="absolute left-4 top-4 rounded-md border border-line bg-paper/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                Peta mitra · live
              </span>
              {[
                { left: "26%", top: "34%", mint: false, d: 0 },
                { left: "62%", top: "26%", mint: false, d: 0.6 },
                { left: "46%", top: "62%", mint: true, d: 1.2 },
              ].map((pin, i) => (
                <motion.span
                  key={i}
                  className={`absolute -ml-2 -mt-2 h-4 w-4 rounded-full ${
                    pin.mint ? "bg-emerald-400" : "bg-amber-400"
                  } ring-4 ${pin.mint ? "ring-emerald-400/20" : "ring-amber-400/20"}`}
                  style={{ left: pin.left, top: pin.top }}
                  animate={reduce ? undefined : { y: [0, -7, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: pin.d, ease: "easeInOut" }}
                />
              ))}
            </div>

            {/* Kartu mitra pertama */}
            <div className="flex items-center gap-4 border-t border-line p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-green/10 bg-green-tint text-sm font-semibold text-green">
                {initials(featured.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold tracking-tight">{featured.name}</p>
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-green" aria-label="Terverifikasi" />
                </div>
                <p className="mt-0.5 flex items-center gap-2 font-mono text-xs tabular-nums text-mute">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {featured.rating?.toFixed(1)}
                  </span>
                  <span>mulai {featured.price}</span>
                </p>
              </div>
              <WhatsAppButton
                provider={featured}
                label=""
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-green/30 text-green transition hover:bg-green hover:text-white"
              />
            </div>

            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                Data asli dari direktori
              </p>
              <p className="font-mono text-[11px] tabular-nums text-faint">
                {PROVIDERS.length} mitra tayang
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
