"use client";

/**
 * DirectoryExperience — orkestrator sisi client dari hero hingga grid:
 *
 *   InteractiveMap (hero 3D)  →  CategoryTimeline (sticky)  →  grid ProviderCard
 *
 * State bersama:
 *   - selectedId : pin/kartu yang disorot (kamera peta terbang ke situ)
 *   - category   : filter kategori dari timeline
 *   - query/dist : dari SearchProvider (dipakai Header/search lama)
 *
 * Peta menampilkan SET hasil filter yang sama dengan grid — apa yang terlihat
 * di bawah = apa yang menyala di peta.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Asterisk, Search, SlidersHorizontal, X } from "lucide-react";
import type { DirectoryProvider } from "@/lib/data";
import { DISTRICTS } from "@/lib/data";
import { useSearch } from "./search-context";
import InteractiveMap from "./InteractiveMap";
import CategoryTimeline from "./CategoryTimeline";
import ProviderCard from "./ProviderCard";

export default function DirectoryExperience({
  providers = [],
  catCounts = {},
}: {
  providers?: DirectoryProvider[];
  catCounts?: Record<string, number>;
}) {
  const { query, setQuery, district, setDistrict, reset } = useSearch();
  const [category, setCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  /* ---------- Filter gabungan: query + kecamatan + kategori ---------- */
  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return providers.filter((p) => {
      const hay = `${p.name} ${p.cat} ${p.district} ${p.keywords}`.toLowerCase();
      return (
        tokens.every((t) => hay.includes(t)) &&
        (district === "all" || p.district === district) &&
        (category === null || p.cat === category)
      );
    });
  }, [providers, query, district, category]);

  const hasFilter = query.trim() !== "" || district !== "all" || category !== null;

  const clearAll = () => {
    reset();
    setCategory(null);
    setSelectedId(null);
  };

  const filterLabel = [
    query.trim() ? `"${query.trim()}"` : null,
    district !== "all" ? `Kec. ${district}` : null,
    category ?? null,
  ].filter(Boolean).join(" · ");

  return (
    <>
      <InteractiveMap
        providers={filtered}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <CategoryTimeline
        counts={catCounts}
        active={category}
        onPick={(label) => {
          setCategory(label);
          setSelectedId(null);
        }}
      />

      {/* ================= GRID DIREKTORI ================= */}
      <section id="penyedia" className="scroll-mt-32 bg-paper">
        <div className="relative mx-auto max-w-6xl px-5 py-14 md:py-20">
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-6 hidden select-none font-serif text-[9rem] leading-none text-green/[0.05] lg:block"
          >
            03
          </span>

          {/* Kepala section */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-end justify-between gap-5"
          >
            <div>
              <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                <Asterisk className="h-3 w-3 text-amber-500" />03 — Direktori
              </p>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl">
                {category ?? "Semua mitra"}{" "}
                <span className="font-mono text-base tabular-nums text-faint">
                  ({filtered.length})
                </span>
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-mute">
                Tanda ✓ Terverifikasi berarti usaha sudah diperiksa langsung
                oleh tim JasaKebumen — nomornya aktif dan layanannya sesuai.
              </p>
            </div>

            {/* Pencarian + kecamatan (glass bar) */}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <label className="relative block sm:w-64">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  placeholder="Cari jasa, mis. cuci AC…"
                  aria-label="Cari usaha mitra"
                  className="w-full rounded-xl border border-line bg-white/80 py-2.5 pl-10 pr-3 text-sm text-ink shadow-sm outline-none backdrop-blur transition placeholder:text-faint/70 focus:border-green/50 focus:ring-2 focus:ring-green/15"
                />
              </label>
              <label className="relative block sm:w-44">
                <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  aria-label="Filter kecamatan"
                  className="w-full appearance-none rounded-xl border border-line bg-white/80 py-2.5 pl-10 pr-8 text-sm text-ink shadow-sm outline-none backdrop-blur transition focus:border-green/50 focus:ring-2 focus:ring-green/15"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d === "all" ? "Semua kecamatan" : d}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </motion.div>

          {/* Bar filter aktif */}
          {hasFilter && (
            <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-mute">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-tint px-3 py-1 text-xs font-medium text-green">
                {filterLabel}
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-medium text-mute transition hover:border-green/40 hover:text-green"
              >
                <X className="h-3 w-3" /> Hapus filter
              </button>
            </div>
          )}

          {/* Grid kartu */}
          {filtered.length > 0 ? (
            <motion.div layout className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((p, i) => (
                  <ProviderCard
                    key={p.id}
                    p={p}
                    index={i}
                    onSelect={setSelectedId}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : providers.length === 0 ? (
            /* DB kosong — ajak mitra pertama */
            <div className="mt-10 rounded-2xl border border-dashed border-line bg-white/60 py-16 text-center backdrop-blur">
              <p className="font-serif text-2xl text-ink">Direktori masih kosong.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mute">
                Jadi mitra pertama yang tayang di peta dan galeri ini —
                pendaftaran gratis dan dikurasi langsung oleh tim kami.
              </p>
              <a
                href="/daftar"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-dark"
              >
                Daftarkan usaha — gratis
              </a>
            </div>
          ) : (
            /* Tidak ada hasil */
            <div className="mt-10 rounded-2xl border border-dashed border-line bg-white/60 py-16 text-center backdrop-blur">
              <p className="text-[15px] font-medium text-ink">Tidak ada mitra yang cocok.</p>
              <p className="mt-1.5 text-sm text-mute">
                Coba kata kunci lain, pilih kategori lain, atau hapus filter.
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-4 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-dark"
              >
                Hapus semua filter
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
