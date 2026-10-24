"use client";

/**
 * CategoryTimeline — "era timeline" museum: deretan pil kategori horizontal
 * yang bisa digeser (touch) / ditahan-dan-seret (mouse), dengan indikator
 * aktif ber-animasi (framer-motion layoutId).
 *
 * Sticky di bawah navbar: saat menggulir direktori, filter kategori tetap
 * terjangkau ibu jari. Count per kategori = data asli dari DB (catCounts).
 */

import { useCallback, useRef, useState } from "react";
import { createElement } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Asterisk, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { CATS } from "@/lib/data";
import { iconForCategory } from "@/lib/category-icons";

export default function CategoryTimeline({
  counts = {},
  active,
  onPick,
}: {
  counts?: Record<string, number>;
  active: string | null;
  onPick: (label: string | null) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false });
  const [dragging, setDragging] = useState(false);
  const reduce = useReducedMotion();

  /* ---------- drag-to-scroll (hanya mouse; touch pakai scroll native) ---------- */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    drag.current = { down: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false };
    setDragging(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = scrollerRef.current;
    if (!el || !drag.current.down) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startLeft - dx;
  }, []);

  const endDrag = useCallback(() => {
    drag.current.down = false;
    setDragging(false);
  }, []);

  const nudge = useCallback((dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: dir * 340, behavior: reduce ? "auto" : "smooth" });
  }, [reduce]);

  const pick = useCallback((label: string | null) => {
    /* Setelah drag, jangan anggap sebagai klik pilih */
    if (drag.current.moved) { drag.current.moved = false; return; }
    onPick(label);
  }, [onPick]);

  return (
    <section id="kategori" aria-label="Kategori usaha" className="sticky top-16 z-30 scroll-mt-20 border-b border-line/70 bg-paper/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">

        <p className="hidden shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-faint md:flex">
          <Asterisk className="h-3 w-3 text-amber-500" /> Galeri
        </p>

        {/* Panah desktop */}
        <button
          type="button"
          onClick={() => nudge(-1)}
          className="hidden h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-white/80 text-mute transition hover:border-green/40 hover:text-green md:grid"
          aria-label="Geser kategori ke kiri"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={scrollerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          role="tablist"
          aria-label="Pilih kategori usaha"
          className={[
            "no-scrollbar flex flex-1 snap-x snap-mandatory items-center gap-2 overflow-x-auto scroll-smooth select-none",
            dragging ? "cursor-grabbing" : "cursor-grab",
          ].join(" ")}
        >
          {/* Semua kategori */}
          <button
            type="button"
            role="tab"
            aria-selected={active === null}
            onClick={() => pick(null)}
            className="relative shrink-0 snap-start"
          >
            {active === null && (
              <motion.span
                layoutId="cat-active"
                className="absolute inset-0 rounded-full bg-green shadow-[0_10px_24px_-10px_rgba(6,78,59,.7)]"
                transition={{ type: "spring", stiffness: 480, damping: 38 }}
              />
            )}
            <span
              className={[
                "relative z-10 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-colors",
                active === null
                  ? "border-transparent text-white"
                  : "border-line bg-white/80 text-ink backdrop-blur hover:border-green/40",
              ].join(" ")}
            >
              <LayoutGrid className={`h-3.5 w-3.5 ${active === null ? "text-amber-300" : "text-green"}`} />
              Semua
            </span>
          </button>

          {/* Era 01..13 — pil kategori */}
          {CATS.map((c) => {
            const count = counts[c.label] ?? 0;
            const isActive = active === c.label;
            return (
              <button
                key={c.n}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => pick(c.label)}
                className="relative shrink-0 snap-start"
                title={c.desc || c.label}
              >
                {isActive && (
                  <motion.span
                    layoutId="cat-active"
                    className="absolute inset-0 rounded-full bg-green shadow-[0_10px_24px_-10px_rgba(6,78,59,.7)]"
                    transition={{ type: "spring", stiffness: 480, damping: 38 }}
                  />
                )}
                <span
                  className={[
                    "relative z-10 inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-[13px] transition-colors",
                    isActive
                      ? "border-transparent text-white"
                      : "border-line bg-white/80 text-ink backdrop-blur hover:border-green/40",
                  ].join(" ")}
                >
                  <span className="hidden font-mono text-[10px] tracking-[0.14em] lg:inline">
                    <span className={isActive ? "text-amber-300" : "text-faint"}>{c.n}</span>
                  </span>
                  {createElement(iconForCategory(c.label), {
                    className: `h-4 w-4 ${isActive ? "text-amber-300" : "text-green"}`,
                  })}
                  <span className={`whitespace-nowrap ${count === 0 && !isActive ? "opacity-45" : ""}`}>
                    {c.label}
                  </span>
                  <span
                    className={[
                      "min-w-5 rounded-full px-1.5 py-0.5 text-center font-mono text-[10px] tabular-nums",
                      isActive ? "bg-white/15 text-amber-200" : "bg-green-tint text-green",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => nudge(1)}
          className="hidden h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-white/80 text-mute transition hover:border-green/40 hover:text-green md:grid"
          aria-label="Geser kategori ke kanan"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
