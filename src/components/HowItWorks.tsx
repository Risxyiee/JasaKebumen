"use client";

import Reveal from "./Reveal";

export default function HowItWorks() {
  return (
    <section id="cara" className="scroll-mt-20 border-t border-line bg-[#062A20] text-white">
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
        <span aria-hidden className="pointer-events-none absolute right-4 top-8 hidden select-none font-serif text-[9rem] leading-none text-white/[0.04] lg:block">04</span>

        <Reveal>
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
            <span className="text-amber-300">✳</span>04 — Cara kerja
          </p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Tiga langkah, selesai.</h2>
        </Reveal>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          {/* 01 — Cari */}
          <Reveal>
            <div className="hiw-scene" aria-hidden="true">
              <div className="hiw-input">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <span key={n} className="hiw-ch" style={{ "--d": `${n * 0.28}s` } as React.CSSProperties} />
                ))}
                <span className="hiw-caret" />
              </div>
              <div className="hiw-row hiw-r1"><i /><b /></div>
              <div className="hiw-row hiw-r2"><i /><b /></div>
              <div className="hiw-map">
                <span className="hiw-pin hiw-p1" />
                <span className="hiw-pin hiw-p2" />
              </div>
            </div>
            <div className="pt-5">
              <p className="font-mono text-xs text-amber-300/80">01</p>
              <h3 className="mt-2.5 text-lg font-semibold tracking-tight">Cari jasa</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Ketik kebutuhanmu dan pilih kecamatan. Hasil muncul seketika, tanpa perlu daftar akun.
              </p>
            </div>
          </Reveal>

          {/* 02 — Pilih (kartu flip) */}
          <Reveal delay={0.12}>
            <div className="hiw-scene" aria-hidden="true">
              <div className="hiw-flip">
                <div className="hiw-flipin">
                  <div className="hiw-face">
                    <span className="hiw-fav" />
                    <span className="hiw-fn" />
                    <span className="hiw-fc" />
                    <span className="hiw-price">Rp75rb</span>
                  </div>
                  <div className="hiw-face hiw-back">
                    <span className="hiw-bt" />
                    <div className="hiw-brow hb1"><i /><b /></div>
                    <div className="hiw-brow hb2"><i /><b /></div>
                    <div className="hiw-brow hb3"><i /><b /></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-5">
              <p className="font-mono text-xs text-amber-300/80">02</p>
              <h3 className="mt-2.5 text-lg font-semibold tracking-tight">Pilih penyedia</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Bandingkan harga mulai, rating, dan lokasi. Semua profil sudah melewati kurasi tim.
              </p>
            </div>
          </Reveal>

          {/* 03 — Chat */}
          <Reveal delay={0.24}>
            <div className="hiw-scene grid place-items-center" aria-hidden="true">
              <div className="relative">
                <div className="bub flex items-center gap-1 rounded-xl rounded-bl-sm bg-white/10 px-2.5 py-2">
                  <span className="hdt" style={{ "--pd": "0s" } as React.CSSProperties} />
                  <span className="hdt" style={{ "--pd": ".15s" } as React.CSSProperties} />
                  <span className="hdt" style={{ "--pd": ".3s" } as React.CSSProperties} />
                </div>
                <div className="chk absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#25D366] px-2 py-0.5 font-mono text-[9px] font-bold text-white">
                  ✓ terkirim
                </div>
              </div>
            </div>
            <div className="pt-5">
              <p className="font-mono text-xs text-amber-300/80">03</p>
              <h3 className="mt-2.5 text-lg font-semibold tracking-tight">Chat WhatsApp</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Nego harga dan janji ketemu langsung dengan mitra. Kami tidak ikut campur, tidak ambil potongan.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
