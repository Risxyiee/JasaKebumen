"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Asterisk, BadgeCheck, MessageCircle, Star } from "lucide-react";
import { initials, type DirectoryProvider } from "@/lib/data";
import { trackWaClick } from "@/lib/track";
import { useSearch } from "./search-context";
import Reveal from "./Reveal";

const pad2 = (i: number) => String(i + 1).padStart(2, "0");

function ProviderRow({ p, i }: { p: DirectoryProvider; i: number }) {
  /* Badge hanya dari data nyata: admin yang memverifikasi usaha satu per satu. */
  const verified = p.verified;
  return (
    <Reveal delay={Math.min(i, 7) * 0.06}>
      <article className="prov-row group border-b border-line transition-colors hover:bg-paper">
        <div className="grid items-center gap-x-8 py-5 px-1 md:grid-cols-[2rem_minmax(0,1fr)_auto_auto] md:px-2">
          <span className="hidden font-mono text-xs tabular-nums text-faint transition-colors group-hover:text-amber-500 md:block">
            {pad2(i)}
          </span>

          <div className="flex min-w-0 items-center gap-4">
            <Link href={`/usaha/${p.id}`} className="flex min-w-0 items-center gap-4 group/link" aria-label={`Lihat profil ${p.name}`}>
            {p.images && p.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.images[0]}
                alt={`Foto usaha ${p.name}`}
                loading="lazy"
                className="h-11 w-11 shrink-0 rounded-lg border border-green/10 object-cover"
              />
            ) : (
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-green/10 bg-green-tint text-sm font-semibold text-green">
                {initials(p.name)}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate font-semibold tracking-tight transition-all duration-300 group-hover/link:translate-x-0.5 group-hover/link:text-green group-hover:translate-x-0.5">
                  {p.name}
                </h3>
                {verified ? (
                  <BadgeCheck className="h-4 w-4 shrink-0 text-green" aria-label="Terverifikasi" />
                ) : (
                  <span className="shrink-0 rounded border border-amber-500/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-600">
                    Baru
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm text-mute">
                {p.cat} · Kec. {p.district}
              </p>
            </div>
            </Link>
          </div>

          <div className="mt-3 flex items-center gap-6 font-mono text-sm tabular-nums md:mt-0 md:justify-self-end">
            {p.rating !== null ? (
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {p.rating?.toFixed(1)} <span className="text-faint">({p.reviews})</span>
              </span>
            ) : (
              <span className="text-amber-600">Mitra baru</span>
            )}
            {/* Label harga lengkap dari data usaha; tanpa data → ajak hubungi */}
            {p.price ? (
              <span className="font-medium text-ink">{p.price}</span>
            ) : (
              <span className="text-faint">hubungi</span>
            )}
          </div>

          <a
            href={`https://wa.me/${p.wa}?text=${encodeURIComponent(p.msg)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackWaClick(p.id, "direktori")}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-green/30 px-4 py-2 text-sm font-semibold text-green transition hover:border-green hover:bg-green hover:text-white md:mt-0 md:justify-self-end"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </article>
    </Reveal>
  );
}

export default function ProviderDirectory({ providers = [] }: { providers?: DirectoryProvider[] }) {
  const { query, district, reset } = useSearch();

  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return providers.filter((p) => {
      const hay = `${p.name} ${p.cat} ${p.district} ${p.keywords}`.toLowerCase();
      return tokens.every((t) => hay.includes(t)) && (district === "all" || p.district === district);
    });
  }, [providers, query, district]);

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
                <Asterisk className="h-3 w-3 text-amber-500" />03 — Penyedia
              </p>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl">Direktori mitra Kebumen</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-mute">
                Tanda ✓ hijau berarti usaha sudah diperiksa langsung oleh tim
                JasaKebumen — nomornya aktif dan layanannya sesuai kategori.
              </p>
            </div>
            <p className="font-mono text-xs tabular-nums text-faint">
              <span id="countShown">{filtered.length}</span> / {providers.length} mitra
            </p>
          </div>
        </Reveal>

        <div id="filterBar" className={`mt-8 ${active ? "flex" : "hidden"} flex-wrap items-center gap-x-2 text-sm text-mute`}>
          <span>Menampilkan hasil untuk</span>
          <span id="filterLabel" className="font-medium text-ink">{filterLabel}</span>
          <button
            id="resetBtn"
            onClick={reset}
            type="button"
            className="font-medium text-green underline underline-offset-4 hover:text-green-dark"
          >
            hapus filter
          </button>
        </div>

        <div id="providerList" className="mt-10 border-t border-line">
          {filtered.map((p, i) => (
            <ProviderRow key={p.id} p={p} i={i} />
          ))}
          {filtered.length > 0 && (
            <p className="py-6 text-center text-sm text-mute">
              Ketuk nama usaha untuk melihat profil lengkap, foto, dan ulasannya.
            </p>
          )}
        </div>

        {/* Belum ada mitra sama sekali (DB kosong) — ajak yang pertama */}
        <div className={`mt-10 border-t border-line py-14 text-center ${providers.length === 0 ? "" : "hidden"}`}>
          <p className="font-serif text-2xl text-ink">Direktori masih kosong.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mute">
            Jadi mitra pertama yang tayang di sini — pendaftaran gratis dan
            dikurasi langsung oleh tim kami sebelum ditampilkan.
          </p>
          <a
            href="/daftar"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-dark"
          >
            Daftarkan usaha — gratis
          </a>
        </div>

        <div id="emptyState" className={`mt-10 ${filtered.length === 0 && providers.length > 0 ? "" : "hidden"} border-t border-line py-14 text-center`}>
          <p className="text-[15px] font-medium">Tidak ada mitra yang cocok.</p>
          <p className="mt-1.5 text-sm text-mute">Coba kata kunci lain, atau pilih &quot;Semua kecamatan&quot;.</p>
          <button
            id="resetBtn2"
            onClick={reset}
            type="button"
            className="mt-4 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-dark"
          >
            Hapus filter
          </button>
        </div>
      </div>
    </section>
  );
}
