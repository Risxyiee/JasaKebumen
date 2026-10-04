"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { directoryStats } from "@/lib/data";

function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!inView) return;
    const dur = 1400, t0 = performance.now();
    const tick = (now: number) => {
      const x = Math.min((now - t0) / dur, 1);
      setVal(reduce ? to : to * (1 - Math.pow(1 - x, 3)));
      if (x < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView, to, reduce]);

  return <span ref={ref}>{val.toFixed(decimals)}</span>;
}

const PAD = ["md:pr-8", "md:px-8", "md:px-8", "md:pl-8"];

export default function Stats() {
  const s = directoryStats();
  const cells = [
    { v: s.mitra, d: 0, label: "Mitra terkurasi & tayang" },
    { v: s.kecamatan, d: 0, label: "Kecamatan dipetakan" },
    { v: s.rating, d: 1, label: "Rating rata-rata mitra" },
    { v: s.ulasan, d: 0, label: "Ulasan dari pelanggan" },
  ];

  return (
    <section id="stats" className="border-y border-line bg-green-tint">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-line px-5 md:grid-cols-4">
        {cells.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={`py-8 md:py-10 ${PAD[i]}`}
          >
            <p className="font-mono text-3xl tabular-nums text-green md:text-4xl">
              <CountUp to={c.v} decimals={c.d} />
            </p>
            <p className="mt-1.5 text-sm text-mute">{c.label}</p>
          </motion.div>
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
