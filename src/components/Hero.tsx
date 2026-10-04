"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Search, ChevronDown, Star, Phone } from "lucide-react";
import { PROVIDERS, DISTRICTS, initials } from "@/lib/data";
import { useSearch, scrollToDirectory } from "./search-context";
import WhatsAppButton from "./WhatsAppButton";

const featured = PROVIDERS[0];

const rise = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

/* Pin data — posisi di permukaan peta */
const PINS = [
  { left: "22%", top: "28%", color: "#fbbf24", label: "Kebumen", d: 0 },
  { left: "55%", top: "20%", color: "#fbbf24", label: "Gombong", d: 0.5 },
  { left: "70%", top: "50%", color: "#fbbf24", label: "Karanganyar", d: 1.0 },
  { left: "35%", top: "55%", color: "#34d399", label: "Prembun", d: 1.5 },
  { left: "48%", top: "42%", color: "#fbbf24", label: "Sruweng", d: 2.0 },
  { left: "80%", top: "35%", color: "#34d399", label: "Ayah", d: 2.5 },
];

/* Jalan-jalan di peta */
const ROADS_H = [
  { top: "30%" }, { top: "48%" }, { top: "65%" },
];
const ROADS_V = [
  { left: "30%" }, { left: "55%" }, { left: "75%" },
];

/* Region kecamatan */
const REGIONS = [
  { left: "10%", top: "15%", width: "30%", height: "25%" },
  { left: "45%", top: "35%", width: "35%", height: "30%" },
  { left: "65%", top: "10%", width: "25%", height: "25%" },
];

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

        {/* ===== 3D Diorama Map ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="lg:mt-8"
        >
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-32px_rgba(6,78,59,.28)]">
            {/* 3D Diorama container */}
            <div className="diorama relative h-64 sm:h-72">
              {/* Label */}
              <span className="absolute left-4 top-3 z-20 rounded-md border border-line bg-paper/95 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-mute shadow-sm backdrop-blur-sm">
                Peta mitra · 3D
              </span>

              {/* Mapped surface (tilted plane) */}
              <div className="diorama-surface bg-grid absolute inset-0 origin-top overflow-hidden bg-paper">
                {/* Regions / kecamatan areas */}
                {REGIONS.map((r, i) => (
                  <div key={i} className="diorama-region" style={{ left: r.left, top: r.top, width: r.width, height: r.height }} />
                ))}

                {/* Horizontal roads */}
                {ROADS_H.map((r, i) => (
                  <div key={`h${i}`} className={`road3d diorama-road-h ${i === 1 ? "diorama-road-main" : ""}`} style={{ top: r.top }} />
                ))}
                {/* Vertical roads */}
                {ROADS_V.map((r, i) => (
                  <div key={`v${i}`} className={`road3d diorama-road-v ${i === 1 ? "diorama-road-main" : ""}`} style={{ left: r.left }} />
                ))}

                {/* 3D Pins */}
                {PINS.map((pin, i) => (
                  <motion.div
                    key={i}
                    className="pin3d"
                    style={{ left: pin.left, top: pin.top }}
                    initial={reduce ? false : { opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + pin.d * 0.15, duration: 0.5, type: "spring", stiffness: 200 }}
                  >
                    {/* Stem */}
                    <div className="pin3d-stem" style={{ background: pin.color }} />
                    {/* Head */}
                    <motion.div
                      className="pin3d-head"
                      style={{ background: pin.color }}
                      animate={reduce ? undefined : { y: [0, -4, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: pin.d * 0.3, ease: "easeInOut" }}
                    />
                    {/* Shadow on surface */}
                    <div className="pin3d-shadow" style={{ background: pin.color }} />
                    {/* Ripple pulse */}
                    <div className="pin3d-ripple" style={{ color: pin.color, animationDelay: `${pin.d * 0.5}s` }} />
                  </motion.div>
                ))}

                {/* Floating mitra card on top of diorama */}
                <motion.div
                  className="float-card absolute left-[12%] top-[8%] z-10 w-[180px] overflow-hidden rounded-xl border border-white/60 bg-white/95 shadow-[0_12px_32px_-8px_rgba(0,0,0,.18)] backdrop-blur-sm sm:w-[200px]"
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center gap-2.5 border-b border-line/60 px-3 py-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-green-tint text-[11px] font-semibold text-green">
                      {initials(featured.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">{featured.name}</p>
                      <p className="flex items-center gap-1 font-mono text-[10px] tabular-nums text-mute">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        {featured.rating?.toFixed(1)}
                        <span className="text-faint">·</span>
                        {featured.price}
                      </p>
                    </div>
                    <MapPin className="h-3 w-3 shrink-0 text-green" />
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">Terverifikasi</span>
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#25D366] text-white">
                      <Phone className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Ambient glow */}
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper/40 via-transparent to-transparent" />
              <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-amber-200/20 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-green/10 blur-3xl" />
            </div>

            {/* Kartu mitra detail bawah diorama */}
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
                {PROVIDERS.length} mitra tayang · {PINS.length} titik dipetakan
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
