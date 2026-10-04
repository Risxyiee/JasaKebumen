"use client";

import { useState } from "react";
import { Asterisk } from "lucide-react";
import Reveal from "./Reveal";

export const FAQ_ITEMS = [
  { q: "Apakah ada biaya untuk pengguna?", a: "Tidak ada. JasaKebumen gratis untuk pencari jasa. Semua negosiasi harga terjadi langsung antara kamu dan mitra lewat WhatsApp." },
  { q: "Apa arti label \"terverifikasi\"?", a: "Mitra sudah melewati kurasi tim: identitas dan usaha dicek, portofolio pekerjaan dilihat, dan nomor WhatsApp dipastikan aktif sebelum profil tayang." },
  { q: "Bagaimana kalau hasil kerja tidak sesuai?", a: "Semua pekerjaan adalah kesepakatan langsung dengan mitra. Kalau ada masalah, laporkan ke admin — mitra dengan laporan berulang kami cabut dari direktori." },
  { q: "Saya punya usaha jasa, bagaimana cara ikut?", a: "Hubungi admin lewat WhatsApp. Siapkan nama usaha, kategori, wilayah kerja, dan beberapa contoh pekerjaan. Pendaftaran gratis, tanpa komisi." },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="scroll-mt-20 border-t border-line bg-white">
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1fr_1.5fr] md:py-24">
        <Reveal>
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            <Asterisk className="h-3 w-3 text-amber-500" />06 — FAQ
          </p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Pertanyaan umum</h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mute">
            Masih ada yang mengganjal? Chat admin lewat WhatsApp, dibalas di bawah 24 jam.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="border-t border-line">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={`faq-item border-b border-line ${open === i ? "open" : ""}`}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="faq-btn flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-[15px] font-medium">{item.q}</span>
                  <span className="faq-x font-mono text-lg text-mute">+</span>
                </button>
                <div className="faq-body">
                  <div>
                    <p className="pb-5 pr-8 text-sm leading-relaxed text-mute">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
