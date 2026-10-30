"use client";

/**
 * ProviderCard — kartu mitra premium (hover lift via framer-motion).
 *
 * ATURAN: tombol "Hubungi via WA" mempertahankan PERSIS logika tracking
 * lama — trackWaClick(providerId, "direktori") dari src/lib/track.ts
 * (sendBeacon → /api/track → KPI PRD). Tidak ada perubahan API.
 */

import Link from "next/link";
import { createElement } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, MapPin, MessageCircle, Star } from "lucide-react";
import { initials, type DirectoryProvider } from "@/lib/data";
import { trackWaClick } from "@/lib/track";
import { iconForCategory } from "@/lib/category-icons";

export default function ProviderCard({
  p,
  onSelect,
  index = 0,
}: {
  p: DirectoryProvider;
  /** Dipanggil saat tombol "Lihat di peta" — menyinkronkan pin di hero 3D. */
  onSelect?: (id: string | null) => void;
  index?: number;
}) {
  const reduce = useReducedMotion();
  const waHref = `https://wa.me/${p.wa}?text=${encodeURIComponent(p.msg)}`;

  const seeOnMap = () => {
    if (!onSelect) return;
    onSelect(p.id);
    document.getElementById("peta")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: reduce ? 0 : 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: reduce ? 1 : 0.97 }}
      viewport={{ once: true, margin: "0px 0px -30px 0px" }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduce ? undefined : { y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_2px_10px_-4px_rgba(28,25,23,.08)] transition-shadow duration-300 hover:shadow-[0_24px_48px_-18px_rgba(10,10,11,0.30)]"
    >
      {/* ---------- Thumbnail ---------- */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-green-tint">
        {p.images && p.images.length > 0 ? (
          <img
            src={p.images[0]}
            alt={`Foto usaha ${p.name}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-emerald-50 via-white to-amber-50">
            <span className="font-serif text-4xl italic text-green/25">{initials(p.name)}</span>
          </div>
        )}

        {/* Badge kategori — glass di atas foto */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-emerald-950/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
          {createElement(iconForCategory(p.cat), { className: "h-3 w-3 text-amber-300" })}
          <span className="max-w-[150px] truncate">{p.cat}</span>
        </span>

        {/* Badge verifikasi — hanya dari data nyata admin */}
        {p.verified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-white/85 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-green backdrop-blur-md">
            <BadgeCheck className="h-3 w-3" /> Terverifikasi
          </span>
        )}

        {/* Tombol lihat di peta */}
        {onSelect && (
          <button
            type="button"
            onClick={seeOnMap}
            className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-emerald-950/55 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:bg-emerald-900 group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Tunjukkan ${p.name} di peta 3D`}
            title="Lihat di peta"
          >
            <MapPin className="h-4 w-4 text-amber-300" />
          </button>
        )}
      </div>

      {/* ---------- Isi ---------- */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/usaha/${p.id}`}
            className="min-w-0 flex-1"
            aria-label={`Lihat profil ${p.name}`}
          >
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink transition-colors group-hover:text-green">
              {p.name}
            </h3>
          </Link>
          {p.rating !== null ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 font-mono text-xs tabular-nums text-amber-700">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {p.rating.toFixed(1)}
              <span className="text-amber-600/60">({p.reviews})</span>
            </span>
          ) : (
            <span className="shrink-0 rounded-md border border-amber-500/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-amber-600">
              Baru
            </span>
          )}
        </div>

        <p className="flex items-center gap-1 text-xs text-mute">
          <MapPin className="h-3 w-3 shrink-0 text-green/60" />
          Kec. {p.district}
          {/* Label harga lengkap dari data usaha: "mulai Rp X" / "Rp X–Y" */}
          {p.price && <span className="text-faint"> · {p.price}</span>}
        </p>

        {p.desc && (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-mute">{p.desc}</p>
        )}

        {/* ---------- Footer aksi ---------- */}
        <div className="mt-auto flex items-center gap-2 pt-2.5">
          {/* KPI PRD — tracking WA utuh (sendBeacon → /api/track) */}
          <a
            href={waHref}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackWaClick(p.id, "direktori")}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green px-3 py-2.5 text-[13px] font-semibold text-black transition-colors hover:bg-green-dark"
          >
            <MessageCircle className="h-4 w-4" /> Hubungi via WA
          </a>
          <Link
            href={`/usaha/${p.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-line px-3 py-2.5 text-[13px] font-semibold text-mute transition-colors hover:border-green/40 hover:text-green"
          >
            Profil
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
