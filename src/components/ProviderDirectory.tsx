"use client";

import { useMemo } from "react";
import { MapPin, RotateCcw, Star } from "lucide-react";
import { PROVIDERS, initials, type Provider } from "@/lib/data";
import { useSearch } from "./search-context";
import WhatsAppButton from "./WhatsAppButton";
import Reveal from "./Reveal";

function ProviderRow({ p, i }: { p: Provider; i: number }) {
  const verified = p.rating !== null;
  return (
    <Reveal delay={Math.min(i * 0.04, 0.3)}>
      <article className="grid items-center gap-2 border-b border-line py-5 md:grid-cols-[1fr_auto_auto] md:gap-6">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-green/10 bg-green-tint text-sm font-semibold text-green">
            {initials(p.name)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold tracking-tight">{p.name}</p>
              {verified && <MapPin className="h-3.5 w-3.5 shrink-0 text-green" aria-label="Terverifikasi" />}
            </div>
            <p className="mt-0.5 truncate text-sm text-mute">
              {p.cat} · Kec. {p.district}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-6 font-mono text-sm tabular-nums md:mt-0 md:justify-self-end">
          {verified ? (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {p.rating?.toFixed(1)} <span className="text-faint">({p.reviews})</span>
            </span>
          ) : (
            <span className="text-amber-600">Mitra baru</span>
          )}
          <span><span className="text-faint">mulai</span> {p.price}</span>
        </div>

        <div className="mt-3 md:mt-0 md:justify-self-end">
          <WhatsAppButton provider={p} />
        </div>
      </article>
    </Reveal>
  );
}

/* ===== Section utama ===== */
export default function ProviderDirectory() {
  const { query, district, reset } = useSearch();

  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return PROVIDERS.filter((p) => {
      const hay = `${p.name} ${p.cat} ${p.district} ${p.keywords}`.toLowerCase();
      return tokens.every((t) => hay.includes(t)) && (district === "all" || p.district === district);
    });
  }, [query, district]);

  const active = query.trim() !== "" || district !== "all";
  const filterLabel = [
    query.trim() ? `"${query.trim()}"` : null,
    district !== "all" ? `Kec. ${district}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <section id="penyedia" className="scroll-mt-20 border-t border-line bg-white">
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
        <span aria-hidden className="pointer-events-none absolute right-4 top-8 hidden select-none font-serif text-[9rem] leading-none text-green/[0.05] lg:block">03</span>

        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                <span className="text-amber-500">✳</span>03 — Penyedia
              </p>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl">Terverifikasi minggu ini</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-mute">
                Dipilih berdasarkan rating, kecepatan respon, dan kelengkapan profil.
              </p>
            </div>
            <p className="font-mono text-xs tabular-nums text-faint">
              <span>{filtered.length}</span> / {PROVIDERS.length} mitra
            </p>
          </div>
        </Reveal>

        {active && (
          <div className="mt-8 flex flex-wrap items-center gap-x-2 text-sm text-mute">
            <span>Menampilkan hasil untuk</span>
            <span className="font-medium text-ink">{filterLabel}</span>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 font-medium text-green underline underline-offset-4 hover:text-green-dark"
            >
              <RotateCcw className="h-3.5 w-3.5" /> hapus filter
            </button>
          </div>
        )}

        <div className="mt-10 border-t border-line">
          {filtered.map((p, i) => (
            <ProviderRow key={p.id} p={p} i={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="border-t border-line py-14 text-center">
            <p className="text-[15px] font-medium">Tidak ada mitra yang cocok.</p>
            <p className="mt-1.5 text-sm text-mute">Coba kata kunci lain, atau pilih &quot;Semua kecamatan&quot;.</p>
            <button
              onClick={reset}
              className="mt-4 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-dark"
            >
              Hapus filter
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
