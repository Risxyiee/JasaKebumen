"use client";

import { useEffect, useRef, useState } from "react";
import { directoryStats } from "@/lib/data";

function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (reduced) {
          setVal(to);
        } else {
          const dur = 1400;
          const t0 = performance.now();
          let raf = 0;
          const tick = (now: number) => {
            const x = Math.min((now - t0) / dur, 1);
            setVal(to * (1 - Math.pow(1 - x, 3)));
            if (x < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
          // Cleanup handled by observer disconnect
        }
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);

  return <span ref={ref}>{val !== null ? val.toFixed(decimals) : "0"}</span>;
}

const PAD = ["md:pr-8", "md:px-8", "md:px-8", "md:pl-8"];

export default function Stats() {
  const s = directoryStats();
  const cells = [
    { v: s.mitra, d: 0, label: "Mitra terkurasi & tayang", stat: "mitra" },
    { v: s.kecamatan, d: 0, label: "Kecamatan dipetakan", stat: "kecamatan" },
    { v: s.rating, d: 1, label: "Rating rata-rata mitra", stat: "rating" },
    { v: s.ulasan, d: 0, label: "Ulasan dari pelanggan", stat: "ulasan" },
  ];

  return (
    <section id="stats" className="border-y border-line bg-green-tint">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-line px-5 md:grid-cols-4 md:divide-x">
        {cells.map((c, i) => (
          <div
            key={c.label}
            data-reveal
            data-delay={i * 80}
            className={`py-8 md:py-10 ${PAD[i]}`}
          >
            <p className="font-mono text-3xl tabular-nums text-green md:text-4xl">
              <span data-stat={c.stat} data-count={c.v} data-decimals={c.d}>
                <CountUp to={c.v} decimals={c.d} />
              </span>
            </p>
            <p className="mt-1.5 text-sm text-mute">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Angka dihitung langsung dari data mitra — ikut naik saat mitra baru bergabung.
        </p>
      </div>
    </section>
  );
}
