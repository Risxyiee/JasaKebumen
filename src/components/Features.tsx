"use client";

import { MessageCircle, ShieldCheck, Tag, MapPin, Globe } from "lucide-react";
import Reveal from "./Reveal";

export default function Features() {
  return (
    <section id="fitur" className="scroll-mt-20 bg-[#062A20] text-white">
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
        <span aria-hidden className="pointer-events-none absolute right-4 top-8 hidden select-none font-serif text-[9rem] leading-none text-white/[0.04] lg:block">01</span>

        <Reveal>
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
            <span className="text-amber-300">✳</span>01 — Fitur
          </p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Kenapa JasaKebumen?</h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55">
            Tanpa aplikasi. Tanpa akun. Tanpa biaya. Cukup browser dan WhatsApp.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Demo chat WA */}
          <Reveal>
            <div className="h-full rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 text-amber-300" />
                <h3 className="font-semibold tracking-tight">Langsung WhatsApp</h3>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="cb max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-3.5 py-2">Bang, AC saya bocor. Bisa dicek hari ini?</div>
                <div className="cb cb-2 max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-3.5 py-2">Bisa. Jam 9 pagi sampai rumah ya.</div>
                <div className="cb cb-3 ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#25D366] px-3.5 py-2 text-white">Siap bang, ditunggu.</div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/50">
                Nego harga dan jadwal langsung dengan mitra. Kami tidak di tengah, tidak ambil potongan.
              </p>
            </div>
          </Reveal>

          {/* 4 kartu dengan stage mini (CSS) */}
          <Reveal delay={0.04}>
            <div className="group flex h-full items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="stage" aria-hidden="true">
                <div className="idc"><span className="iav" /><span className="il1" /><span className="il2" /></div>
                <span className="iscan" />
                <span className="ick">✓</span>
              </div>
              <div className="min-w-0">
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                <h3 className="mt-2 font-semibold tracking-tight">Kurasi manusia</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                  Identitas, portofolio pekerjaan, dan nomor WA dicek tim sebelum profil tayang.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.07}>
            <div className="group flex h-full items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="stage" aria-hidden="true">
                <span className="tagn" />
                <span className="tagp">Rp75</span>
              </div>
              <div className="min-w-0">
                <Tag className="h-4 w-4 text-amber-300" />
                <h3 className="mt-2 font-semibold tracking-tight">Harga mulai tertera</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                  Tahu kisaran biaya dari profil — tidak ada kejutan harga saat chat pertama.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="group flex h-full items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="stage" aria-hidden="true">
                <div className="mmap">
                  <i className="r1" /><i className="r2" /><i className="v1" />
                  <span className="mp" style={{ left: "24%", top: "30%", "--d": "0s" } as React.CSSProperties} />
                  <span className="mp" style={{ left: "62%", top: "24%", "--d": ".35s" } as React.CSSProperties} />
                  <span className="mp" style={{ left: "40%", top: "66%", "--d": ".7s" } as React.CSSProperties} />
                  <span className="mp near" style={{ left: "76%", top: "62%", "--d": "1.05s" } as React.CSSProperties} />
                </div>
              </div>
              <div className="min-w-0">
                <MapPin className="h-4 w-4 text-amber-300" />
                <h3 className="mt-2 font-semibold tracking-tight">Filter 28 kecamatan</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                  Dari Kebumen kota sampai Ayah dan Rowokele — cari mitra yang paling dekat.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Banner lebar */}
          <Reveal className="lg:col-span-3" delay={0.14}>
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="stage" aria-hidden="true">
                <div className="brw">
                  <div className="bbar"><b /><b /><b /><span className="u" /></div>
                  <span className="bl bl1" /><span className="bl bl2" /><span className="bl bl3" />
                </div>
              </div>
              <p className="text-sm leading-relaxed text-white/70">
                <strong className="font-semibold text-white">Tanpa aplikasi &amp; tanpa akun.</strong>{" "}
                Buka browser, cari, chat — selesai. Halaman ini ringan, hemat kuota, dan jalan di HP kentang sekalipun.
              </p>
              <Globe className="ml-auto hidden h-5 w-5 shrink-0 text-amber-300 sm:block" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
