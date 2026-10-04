"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./Reveal";

const CARI = [
  "Cari jasa dari 8+ kategori tanpa daftar akun",
  "Filter berdasarkan kecamatan terdekat",
  "Lihat rating, ulasan, dan harga mulai sebelum chat",
  "Hubungi mitra langsung lewat WhatsApp — tanpa perantara",
  "Gratis 100%. Tidak ada biaya layanan.",
];

const MITRA = [
  "Profilmu tayang di direktori, dilihat ribuan pencari per bulan",
  "Kurasi dan verifikasi gratis — tidak ada biaya pendaftaran",
  "Pelanggan menghubungi WA-mu langsung — tanpa komisi",
  "Harga mulai tertera di profil, mengurangi chat basi",
  "Mitra aktif mendapat prioritas tampil di atas",
];

function Panel({ items }: { items: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((text, i) => (
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          className="flex gap-3 rounded-xl border border-line bg-white p-5"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 place-items-center rounded-full bg-green-tint text-[11px] font-semibold text-green">
            {i + 1}
          </span>
          <p className="text-sm leading-relaxed text-mute">{text}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function Benefits() {
  const [tab, setTab] = useState<"cari" | "mitra">("cari");

  return (
    <section id="benefits" className="scroll-mt-20 border-t border-line">
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
        <span aria-hidden className="pointer-events-none absolute right-4 top-8 hidden select-none font-serif text-[9rem] leading-none text-green/[0.05] lg:block">05</span>

        <Reveal>
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            <span className="text-amber-500">✳</span>05 — Keuntungan
          </p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Manfaat nyata, bukan janji.</h2>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="relative mt-8 inline-flex rounded-xl border border-line bg-paper p-1">
            {tab === "cari" && (
              <motion.span layoutId="benInk" className="absolute bottom-1 left-1 top-1 rounded-lg bg-green"
                transition={{ type: "spring", stiffness: 400, damping: 32 }} />
            )}
            {tab === "mitra" && (
              <motion.span layoutId="benInk" className="absolute bottom-1 top-1 rounded-lg bg-green"
                style={{ left: "calc(50% + 2px)" }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }} />
            )}
            {(["cari", "mitra"] as const).map((t) => (
              <button
                key={t}
                role="tab" aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`relative z-10 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
                  tab === t ? "text-white" : "text-mute"
                }`}
              >
                {t === "cari" ? "Untuk pencari jasa" : "Untuk pemilik usaha"}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-10">
          <AnimatePresence mode="wait">
            {tab === "cari" ? <Panel key="cari" items={CARI} /> : <Panel key="mitra" items={MITRA} />}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
