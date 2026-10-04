"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { AirVent, ArrowUpRight, Camera, Car, Hammer, Laptop, Scissors, Sparkles, Zap, type LucideIcon } from "lucide-react";
import Reveal from "./Reveal";
import { CATS, type CategoryIcon } from "@/lib/data";
import { scrollToDirectory, useSearch } from "./search-context";

const ICONS: Record<CategoryIcon, LucideIcon> = {
  "air-vent": AirVent, laptop: Laptop, car: Car, sparkles: Sparkles,
  camera: Camera, hammer: Hammer, scissors: Scissors, zap: Zap,
};

export default function CategoryGrid() {
  const { setQuery } = useSearch();
  const reduce = useReducedMotion();
  const hoverable = useRef(false);

  useEffect(() => {
    hoverable.current = window.matchMedia("(hover:hover)").matches;
  }, []);

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!hoverable.current || reduce) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = "transform .08s linear, border-color .3s, box-shadow .3s";
    el.style.transform = `perspective(700px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-2px)`;
  };
  const onLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transition = "transform .55s cubic-bezier(.22,1,.36,1), border-color .3s, box-shadow .3s";
    e.currentTarget.style.transform = "";
  };

  const pick = (q: string) => { setQuery(q); scrollToDirectory(); };

  return (
    <section id="kategori" className="scroll-mt-20">
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
        <span aria-hidden className="pointer-events-none absolute right-4 top-8 hidden select-none font-serif text-[9rem] leading-none text-green/[0.05] lg:block">02</span>

        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                <span className="text-amber-500">✳</span>02 — Kategori
              </p>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl">Kategori terpopuler</h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-mute">
              Delapan kategori yang paling sering dicari pengguna bulan ini. Klik untuk memfilter daftar mitra.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATS.map((c, i) => {
            const Icon = ICONS[c.icon];
            return (
              <Reveal key={c.n} delay={(i % 4) * 0.07} className={c.wide ? "sm:col-span-2 lg:col-span-2" : ""}>
                <button
                  type="button"
                  onClick={() => pick(c.q)}
                  onMouseMove={onMove}
                  onMouseLeave={onLeave}
                  className="group h-full w-full rounded-xl border border-line bg-white text-left transition-colors duration-300 hover:border-green/40 hover:shadow-[0_20px_48px_-24px_rgba(6,78,59,.3)]"
                >
                  {c.wide ? (
                    <div className="flex items-center gap-5 p-5">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-green-tint text-green transition-colors duration-300 group-hover:bg-amber-50 group-hover:text-amber-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[17px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-green">{c.label}</h3>
                        <p className="mt-0.5 truncate text-sm text-mute">{c.desc}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="font-mono text-[11px] text-faint">{c.n}</span>
                        <span className="font-mono text-[11px] tabular-nums text-mute">{c.count} mitra</span>
                        <ArrowUpRight className="h-4 w-4 -translate-x-1 text-green opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <span className="grid h-11 w-11 place-items-center rounded-lg bg-green-tint text-green transition-colors duration-300 group-hover:bg-amber-50 group-hover:text-amber-600">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="font-mono text-[11px] text-faint">{c.n}</span>
                      </div>
                      <h3 className="mt-4 text-[15px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-green">{c.label}</h3>
                      <p className="mt-1 flex items-center justify-between font-mono text-[11px] tabular-nums text-mute">
                        {c.count} mitra
                        <ArrowUpRight className="h-3.5 w-3.5 -translate-x-1 text-green opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                      </p>
                    </div>
                  )}
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
