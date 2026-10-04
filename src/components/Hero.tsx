"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { ChevronDown, Search } from "lucide-react";
import { DISTRICTS } from "@/lib/data";
import { scrollToDirectory, useSearch } from "./search-context";

const HeroDiorama = dynamic(() => import("./HeroDiorama"), {
  ssr: false,
  loading: () => <DioramaSkeleton />,
});

const WORDS = ["Cari", "&", "panggil", "jasa", "lokal", "Kebumen,"];

function WibClock() {
  const [time, setTime] = useState("—:—");
  useEffect(() => {
    const tick = () => {
      const d = new Date(Date.now() + (new Date().getTimezoneOffset() + 420) * 60000);
      setTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums text-mute">{time}</span>;
}

function DioramaSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-32px_rgba(6,78,59,.28)]">
      <div className="bg-grid relative h-[320px] sm:h-[400px] lg:h-[440px]">
        <span className="absolute left-4 top-4 rounded-md border border-line bg-paper/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
          Diorama mitra · 3D
        </span>
        {[
          { left: "30%", top: "38%" },
          { left: "58%", top: "30%" },
          { left: "46%", top: "60%" },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute h-4 w-4 animate-pulse rounded-full bg-amber-400/60 ring-4 ring-amber-400/15"
            style={{ left: p.left, top: p.top }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
          Memuat diorama…
        </p>
        <span className="h-6 w-20 animate-pulse rounded-md bg-line" />
      </div>
    </div>
  );
}

export default function Hero() {
  const { query, setQuery, district, setDistrict } = useSearch();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    scrollToDirectory();
  };

  return (
    <section className="relative pb-14 pt-28 md:pb-20 md:pt-40">
      <p
        aria-hidden
        className="pointer-events-none absolute left-1 top-56 hidden select-none font-mono text-[10px] uppercase tracking-[0.32em] text-faint [writing-mode:vertical-rl] xl:block"
      >
        7.6708° S — 109.6528° E · Kabupaten Kebumen
      </p>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="lg:pr-4">
          <p className="rise font-mono text-[11px] uppercase tracking-[0.18em] text-faint" style={{ animationDelay: ".05s" }}>
            Direktori jasa lokal — Kebumen · <WibClock /> WIB
          </p>

          <h1 className="mt-5 font-serif text-[2.7rem] leading-[1.04] md:text-[4.1rem]">
            {WORDS.map((w, i) => (
              <span key={i} className="w" style={{ "--i": i } as CSSProperties}>
                {w}&nbsp;
              </span>
            ))}
            <span className="w relative inline-block whitespace-nowrap" style={{ "--i": 6 } as CSSProperties}>
              <em className="italic text-green">tanpa ribet.</em>
              <svg
                className="swoosh absolute -bottom-1.5 left-0 w-full"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M3 9 C 60 2, 140 2, 197 7"
                  stroke="#F59E0B"
                  strokeWidth="4.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="rise mt-6 max-w-xl text-[15px] leading-relaxed text-mute md:text-base" style={{ animationDelay: ".4s" }}>
            Menghubungkan kamu ke teknisi, tukang, dan penyedia jasa terverifikasi
            di 28 kecamatan. Hubungi langsung lewat WhatsApp — tanpa aplikasi,
            tanpa biaya, tanpa perantara.
          </p>

          <form className="rise mt-9 max-w-xl" style={{ animationDelay: ".5s" }} onSubmit={onSubmit} autoComplete="off">
            <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-2 transition-colors focus-within:border-green/40 md:flex-row md:items-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                aria-label="Cari jasa"
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
                    <option key={d} value={d}>
                      {d === "all" ? "Semua kecamatan" : d}
                    </option>
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
          </form>

          <p className="rise mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-faint" style={{ animationDelay: ".58s" }}>
            Gratis untuk pencari · Langsung WhatsApp · Mitra dikurasi tim
          </p>
        </div>

        <div className="rise lg:mt-12" style={{ animationDelay: ".35s" }}>
          <HeroDiorama />
        </div>
      </div>
    </section>
  );
}
