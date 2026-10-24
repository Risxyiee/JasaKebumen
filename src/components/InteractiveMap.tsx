"use client";

/**
 * InteractiveMap — hero "virtual tour" 3D (Mapbox GL Standard style).
 *
 * - pitch/bearing aktif: drag-to-look seperti tur museum
 * - 3D buildings bawaan style Standard + lightPreset Siang/Malam
 * - marker glass ber-ikon kategori; klik → kamera terbang + popup glass
 * - popup memuat tombol "Hubungi via WA" — tracking /api/track WAJIB utuh
 * - mobile (mis. iPhone XR): cooperativeGestures → satu jari menggulir
 *   halaman, dua jari menggerakkan/miringkan peta. Tidak ada scroll-trap.
 *
 * Token: NEXT_PUBLIC_MAPBOX_TOKEN (build-time). Tanpa token → fallback
 * glass yang tetap cantik, direktori di bawah tetap berfungsi penuh.
 */

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { MapPin, Moon, Move3d, Sun } from "lucide-react";
import type { DirectoryProvider } from "@/lib/data";

/* Peta inti — client-only (mapbox-gl menyentuh window), popup digambar
   di dalamnya karena butuh konteks kamera map. */
const MapCore = dynamic(() => import("./MapCore"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-emerald-950">
      <div className="flex flex-col items-center gap-3 text-emerald-100/60">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200/20 border-t-amber-400" />
        <p className="font-mono text-[11px] uppercase tracking-[0.18em]">Memuat peta 3D…</p>
      </div>
    </div>
  ),
});

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/* ------------------------------------------------------------------ */
/* Fallback tanpa token Mapbox                                         */
/* ------------------------------------------------------------------ */

function MapFallback({ total, kecamatan }: { total: number; kecamatan: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-emerald-950">
      {/* Dekorasi grid halus ala denah museum */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 40%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 40%, black 30%, transparent 75%)",
        }}
      />
      <div className="relative mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/70 backdrop-blur">
          <MapPin className="h-3 w-3 text-amber-400" /> Peta mitra 3D — Kabupaten Kebumen
        </span>
        <h1 className="mt-6 font-serif text-4xl leading-[1.08] text-white md:text-6xl">
          Jelajahi <em className="italic text-amber-300">semua jasa</em>
          <br /> di satu papan.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-emerald-100/70 md:text-base">
          {total > 0
            ? `${total} usaha terkurasi di ${kecamatan} kecamatan — temukan, bandingkan, lalu hubungi langsung via WhatsApp.`
            : "Direktori jasa & UMKM 26 kecamatan — temukan, bandingkan, lalu hubungi langsung via WhatsApp."}
        </p>
        <a
          href="#penyedia"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-emerald-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400"
        >
          Lihat direktori mitra ↓
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero wrapper                                                        */
/* ------------------------------------------------------------------ */

export default function InteractiveMap({
  providers,
  selectedId,
  onSelect,
}: {
  providers: DirectoryProvider[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [preset, setPreset] = useState<"day" | "dusk">("dusk");

  const totalMitra = providers.length;
  const kecamatanTayang = useMemo(
    () => new Set(providers.map((p) => p.district)).size,
    [providers]
  );

  return (
    <section id="peta" aria-label="Peta interaktif mitra JasaKebumen" className="relative">
      <div className="relative h-[86svh] min-h-[560px] w-full overflow-hidden bg-emerald-950 md:h-[92svh]">
        {MAPBOX_TOKEN ? (
          <MapCore
            providers={providers}
            selectedId={selectedId}
            onSelect={onSelect}
            preset={preset}
          />
        ) : (
          <MapFallback total={totalMitra} kecamatan={kecamatanTayang} />
        )}

        {/* ---------- Overlay glass (di atas peta, non-interaktif) ---------- */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {/* Vignette bawah agar transisi ke body mulus */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-950/90 to-transparent"
          />

          {/* Kiri-atas: papan judul glass — hanya saat peta hidup
              (fallback punya headline sendiri di tengah) */}
          {MAPBOX_TOKEN && (
            <div className="absolute left-4 top-20 max-w-[calc(100%-2rem)] md:left-8 md:top-24">
              <div className="pointer-events-auto rounded-2xl border border-white/15 bg-emerald-950/55 p-4 shadow-[0_16px_44px_-16px_rgba(0,0,0,.6)] backdrop-blur-xl md:p-5">
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/90">
                  <Move3d className="h-3.5 w-3.5" /> Tur virtual · Peta 3D
                </p>
                <h1 className="mt-2 font-serif text-[1.55rem] leading-tight text-white md:text-4xl">
                  Direktori jasa &amp; UMKM <em className="italic text-amber-300">Kebumen</em>
                </h1>
                <p className="mt-1.5 hidden max-w-sm text-[13px] leading-relaxed text-white/65 md:block">
                  Seret untuk melihat sekeliling, klik pin usaha untuk membuka
                  detailnya — hubungi langsung, tanpa komisi.
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/55 md:hidden">
                  Geser dua jari untuk menjelajah · ketuk pin usaha.
                </p>
              </div>
            </div>
          )}

          {/* Kanan-atas: toggle Siang/Malam (hanya saat peta hidup) */}
          {MAPBOX_TOKEN && (
            <div className="pointer-events-auto absolute right-4 top-20 md:right-8 md:top-24">
              <button
                type="button"
                onClick={() => setPreset((v) => (v === "dusk" ? "day" : "dusk"))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-emerald-950/55 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80 backdrop-blur-xl transition hover:border-amber-300/50 hover:text-amber-300"
                aria-label={preset === "dusk" ? "Ganti ke mode siang" : "Ganti ke mode malam"}
              >
                {preset === "dusk" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {preset === "dusk" ? "Siang" : "Malam"}
              </button>
            </div>
          )}

          {/* Bawah: chip statistik glass */}
          <div className="absolute bottom-5 left-4 right-4 flex flex-wrap items-end justify-between gap-3 md:left-8 md:right-8">
            <div className="pointer-events-auto flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-emerald-950/55 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <b className="tabular-nums">{totalMitra}</b>&nbsp;mitra tayang
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-emerald-950/55 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <b className="tabular-nums">{kecamatanTayang}</b>&nbsp;dari 26 kecamatan
              </span>
            </div>
            {!MAPBOX_TOKEN && (
              <span className="pointer-events-auto hidden rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 font-mono text-[10px] text-amber-200/80 backdrop-blur md:block">
                owner: set NEXT_PUBLIC_MAPBOX_TOKEN untuk peta 3D
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
