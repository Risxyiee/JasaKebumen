"use client";

import { useState, type ReactNode, type CSSProperties } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { HandCoins, Megaphone, PiggyBank, ShieldCheck, Tag, Trophy, Users, Zap, type LucideIcon } from "lucide-react";
import Reveal from "./Reveal";

interface Item { title: string; desc: string; vig: ReactNode; }

const listV: Variants = { show: { transition: { staggerChildren: 0.07 } }, exit: { opacity: 0, transition: { duration: 0.12 } } };
const itemV: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const CARD = "bcard group flex h-full items-start gap-5 rounded-xl border border-line bg-paper p-5 transition duration-300 hover:-translate-y-0.5 hover:border-green/40 hover:shadow-[0_18px_44px_-22px_rgba(6,78,59,.28)]";

const vd = (v: string) => ({ "--d": v }) as CSSProperties;
const pd = (v: string) => ({ "--pd": v }) as CSSProperties;

const CARI: Item[] = [
  {
    title: "Gratis, selamanya",
    desc: "Tanpa biaya admin, tanpa potongan harga. Semua negosiasi murni kamu dan mitra.",
    vig: (
      <div className="vig" aria-hidden>
        <span className="vc" /><span className="vc vc-2" /><span className="vc vc-3" />
        <span className="absolute inset-x-0 bottom-3.5 text-center font-mono text-[22px] font-medium leading-none text-green">Rp0</span>
        <span className="absolute inset-x-0 bottom-1.5 text-center font-mono text-[8px] uppercase tracking-[0.14em] text-faint">biaya admin</span>
      </div>
    ),
  },
  {
    title: "Harga jelas sebelum chat",
    desc: "Tiap profil mencantumkan \"harga mulai\" — kamu tahu kisaran biaya sebelum menghubungi.",
    vig: (
      <div className="vig grid place-items-center" aria-hidden>
        <div className="text-center">
          <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-faint">mulai dari</p>
          <div className="mx-auto h-7 overflow-hidden rounded-md border border-line bg-white px-2 font-mono text-xs leading-7 text-green">
            <div className="rollCol"><span>Rp75.000</span><span>Rp15.000</span><span>Rp500.000</span><span>Rp75.000</span></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Bukan comotan Maps",
    desc: "Mitra dikurasi satu per satu: identitas dicek, pekerjaan diteliti, nomor WA dipastikan aktif.",
    vig: (
      <div className="vig grid place-items-center" aria-hidden>
        <div className="space-y-1.5 font-mono text-[10px] text-mute">
          <div className="flex items-center gap-1.5"><span className="kdot" style={vd("0s")} />Identitas</div>
          <div className="flex items-center gap-1.5"><span className="kdot" style={vd(".7s")} />Portofolio</div>
          <div className="flex items-center gap-1.5"><span className="kdot" style={vd("1.4s")} />WA aktif</div>
        </div>
      </div>
    ),
  },
  {
    title: "Respons cepat",
    desc: "Mitra lambat merespons kami ingatkan; berulang kali, profilnya dicabut dari direktori.",
    vig: (
      <div className="vig grid place-items-center" aria-hidden>
        <div className="relative">
          <div className="bub flex items-center gap-1 rounded-xl rounded-bl-sm bg-green-tint px-2.5 py-2">
            <span className="dt" style={pd("0s")} />
            <span className="dt" style={pd(".15s")} />
            <span className="dt" style={pd(".3s")} />
          </div>
          <div className="chk absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-green px-2 py-0.5 font-mono text-[9px] font-bold text-white">✓ dibalas</div>
        </div>
      </div>
    ),
  },
];

const MITRA: Item[] = [
  {
    title: "Tayang gratis, selamanya",
    desc: "Tidak ada biaya pendaftaran, tidak ada langganan. Profilmu tayang tanpa batas waktu.",
    vig: (
      <div className="vig" aria-hidden>
        <div className="mcardA absolute inset-x-4 top-3 bottom-7 rounded-md border border-line bg-white p-2">
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green/25" /><span className="h-1.5 w-9 rounded bg-line" /></div>
          <span className="mt-1.5 block h-1.5 w-12 rounded bg-line" />
          <span className="mt-1 block h-1.5 w-7 rounded bg-line" />
        </div>
        <span className="stampA absolute bottom-2.5 right-1.5 rounded border-2 border-green bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wide text-green">TAYANG</span>
      </div>
    ),
  },
  {
    title: "Tanpa komisi",
    desc: "Semua hasil transaksi 100% milikmu. Kami tidak ikut ambil sepeser pun.",
    vig: (
      <div className="vig grid place-items-center" aria-hidden>
        <div className="text-center">
          <svg viewBox="0 0 40 40" className="mx-auto h-12 w-12 -rotate-90">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#E7E4DE" strokeWidth="4" />
            <circle className="ringA" cx="20" cy="20" r="16" fill="none" stroke="#064E3B" strokeWidth="4" strokeLinecap="round" strokeDasharray="100.53" strokeDashoffset="0" />
          </svg>
          <p className="ringTxt mt-0.5 font-mono text-[9px] font-bold text-green">100% milikmu</p>
        </div>
      </div>
    ),
  },
  {
    title: "Pelanggan datang sendiri",
    desc: "Mereka yang mencari, membandingkan, lalu menghubungi WhatsApp-mu. Kamu tinggal balas.",
    vig: (
      <div className="vig" aria-hidden>
        <div className="absolute left-4 right-9 top-1/2 border-t border-dashed border-line" />
        <svg className="pinT absolute left-4 top-1/2 -mt-2.5 h-5 w-5" viewBox="0 0 24 24" fill="#064E3B">
          <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" />
          <circle cx="12" cy="9" r="2.6" fill="#fff" />
        </svg>
        <span className="absolute right-3 top-1/2 -mt-2 h-4 w-4">
          <span className="waPing absolute inset-0 rounded-full bg-[#25D366]" />
          <span className="absolute inset-0 rounded-full bg-[#25D366]" />
        </span>
      </div>
    ),
  },
  {
    title: "Slot unggulan awal",
    desc: "Pendaftar pertama di tiap kategori tayang paling atas. Direktori ini baru diluncurkan — waktunya pas.",
    vig: (
      <div className="vig flex items-end justify-center gap-2.5 pb-3" aria-hidden>
        <div className="relative">
          <span className="starA absolute -top-4 left-1/2 text-sm text-amber-500">★</span>
          <div className="bar h-14 w-4 rounded-t-md bg-green" />
        </div>
        <div className="bar bar2 h-10 w-4 rounded-t-md bg-[#DDE8E1]" />
        <div className="bar bar3 h-7 w-4 rounded-t-md bg-[#EAE6DC]" />
      </div>
    ),
  },
];

const TABS = [
  { key: "cari" as const, label: "Untuk pencari jasa" },
  { key: "mitra" as const, label: "Untuk pemilik usaha" },
];

function Panel({ items }: { items: Item[] }) {
  return (
    <motion.div variants={listV} initial="hidden" animate="show" exit="exit" className="grid gap-3 sm:grid-cols-2">
      {items.map((it) => (
        <motion.div key={it.title} variants={itemV} className={CARD}>
          {it.vig}
          <div className="min-w-0">
            <h3 className="font-semibold tracking-tight transition-colors group-hover:text-green">{it.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-mute">{it.desc}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function Benefits() {
  const [tab, setTab] = useState<"cari" | "mitra">("cari");

  return (
    <section id="untung" className="scroll-mt-20 border-t border-line bg-white">
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
        <span aria-hidden className="pointer-events-none absolute right-4 top-8 hidden select-none font-serif text-[9rem] leading-none text-green/[0.05] lg:block">05</span>

        <Reveal>
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            <span className="text-amber-500">✳</span>05 — Keuntungan
          </p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Apa untungnya pakai ini?</h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-9 inline-flex rounded-xl border border-line bg-paper p-1" role="tablist" aria-label="Keuntungan">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className="relative rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                {tab === t.key && (
                  <motion.span
                    layoutId="benInk"
                    className="absolute inset-0 rounded-lg bg-green"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className={`relative z-10 ${tab === t.key ? "text-white" : "text-mute"}`}>
                  {t.label}
                </span>
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
