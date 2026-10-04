"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Asterisk, BadgeCheck, MessageCircle, Phone, Search, Send } from "lucide-react";
import Reveal from "./Reveal";

const vd = (v: string) => ({ "--ad": v }) as CSSProperties;

const CW_PERIOD = 7;

const STEP_COLS = [
  { n: "01", title: "Cari jasa", desc: "Ketik kebutuhanmu dan pilih kecamatan. Hasil muncul seketika, tanpa perlu daftar akun." },
  { n: "02", title: "Pilih penyedia", desc: "Bandingkan harga mulai, rating, dan lokasi. Semua profil sudah melewati kurasi tim." },
  { n: "03", title: "Chat WhatsApp", desc: "Nego harga dan janji ketemu langsung dengan mitra. Kami tidak ikut campur, tidak ambil potongan." },
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const inkRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const activeRef = useRef(0);

  const moveInk = useCallback((idx: number) => {
    const btn = tabRefs.current[idx];
    const ink = inkRef.current;
    if (!btn || !ink) return;
    const r = btn.getBoundingClientRect();
    const pr = btn.parentElement?.getBoundingClientRect();
    if (!pr) return;
    ink.style.width = r.width + "px";
    ink.style.transform = `translateX(${r.left - pr.left - 4}px)`;
  }, []);

  const showPanelRef = useRef<((i: number, isUser: boolean) => void) | null>(null);

  const showPanel = useCallback((i: number, isUser: boolean) => {
    setActive(i);
    activeRef.current = i;

    // Switch panels
    panelRefs.current.forEach((p, j) => {
      if (!p) return;
      if (j === i) {
        p.style.display = "none";
        void p.offsetWidth; // force reflow
        p.style.display = "";
        p.classList.add("active");
      } else {
        p.classList.remove("active");
      }
    });

    // Move ink
    moveInk(i);

    // Update tabs
    tabRefs.current.forEach((b, j) => {
      if (!b) return;
      const on = j === i;
      b.setAttribute("aria-selected", on ? "true" : "false");
      if (on) {
        b.classList.add("text-green-dark");
        b.classList.remove("text-white/60");
      } else {
        b.classList.remove("text-green-dark");
        b.classList.add("text-white/60");
      }
    });

    // Update step columns
    colRefs.current.forEach((c, j) => {
      if (!c) return;
      const on = j === i;
      if (on) {
        c.classList.add("border-amber-400", "opacity-100");
        c.classList.remove("border-white/10", "opacity-40");
      } else {
        c.classList.remove("border-amber-400", "opacity-100");
        c.classList.add("border-white/10", "opacity-40");
      }
    });

    // Progress fill
    const fill = fillRef.current;
    if (!fill) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (isUser) {
      fill.style.animation = "none";
      fill.style.transform = "scaleX(1)";
      fill.style.opacity = ".25";
    } else {
      fill.style.transform = "";
      fill.style.opacity = "1";
      fill.style.animation = "none";
      void fill.offsetWidth;
      fill.style.animation = `cwProgK ${CW_PERIOD}s linear forwards`;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        timerRef.current = setTimeout(() => {
          showPanelRef.current?.((i + 1) % 3, false);
        }, CW_PERIOD * 1000);
      }
    }
  }, [moveInk]);

  // Keep ref in sync
  useEffect(() => {
    showPanelRef.current = showPanel;
  }, [showPanel]);

  // Start auto-play on intersection
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((en) => {
      if (en[0].isIntersecting && !startedRef.current) {
        startedRef.current = true;
        showPanel(0, false);
        obs.disconnect();
      }
    }, { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [showPanel]);

  // Handle resize
  useEffect(() => {
    const onResize = () => moveInk(activeRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [moveInk]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <section id="cara" className="scroll-mt-20 border-t border-line bg-green-dark text-white">
      <div ref={sectionRef} className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
        <span aria-hidden className="pointer-events-none absolute right-4 top-8 hidden select-none font-serif text-[9rem] leading-none text-white/[0.04] lg:block">04</span>

        <Reveal>
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
            <Asterisk className="h-3 w-3 text-amber-300" />04 — Cara kerja
          </p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Tiga langkah, selesai.</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
            Tiga demo yang berjalan sendiri — berpindah otomatis, atau klik tabnya kalau mau pilih.
          </p>
        </Reveal>

        <Reveal>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="relative inline-flex flex-wrap rounded-xl border border-white/15 bg-white/5 p-1">
              <span ref={inkRef} className="absolute bottom-1 left-1 top-1 rounded-lg bg-amber-400" style={{ width: 0 }} />
              {["01 · Cari jasa", "02 · Pilih penyedia", "03 · Chat WhatsApp"].map((label, i) => (
                <button
                  key={i}
                  ref={(el) => { tabRefs.current[i] = el; }}
                  type="button"
                  onClick={() => showPanel(i, true)}
                  className="stab relative z-10 rounded-lg px-4 py-2.5 text-sm font-semibold text-white/60 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/35">Otomatis · klik tab untuk pilih</p>
          </div>
          <div className="mt-3 h-0.5 max-w-md overflow-hidden rounded-full bg-white/10">
            <span ref={fillRef} id="stepFill" className="block h-full origin-left scale-x-0 bg-amber-400" />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="cw-stage">
              <span className="pointer-events-none absolute left-4 top-4 z-10 rounded-md border border-white/15 bg-green-dark/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Demo · berjalan sendiri</span>

              {/* Panel 1: Cari */}
              <div ref={(el) => { panelRefs.current[0] = el; }} className="cw-panel" aria-hidden="true">
                <div className="cw-card">
                  <div className="cw-bar"><b /><b /><b /><span className="cw-url">jasakebumen.id</span></div>
                  <div className="cw-body">
                    <div className="cw-searchrow">
                      <Search />
                      <span className="cw-type">servis AC</span>
                      <span className="cw-caret" />
                    </div>
                    <div className="cw-chiprow hm" style={vd("1.7s")}>
                      <span className="cw-count">3 mitra cocok</span>
                      <span className="cw-loc">Kec. Kebumen</span>
                    </div>
                    <div className="cw-res hm" style={vd("2.15s")}>
                      <span className="cw-av">AS</span>
                      <div className="cw-rinfo"><b>AC Sejahtera</b><span>Servis AC &amp; elektronik · Kec. Kebumen</span></div>
                      <span className="cw-wa"><MessageCircle />WA</span>
                    </div>
                    <div className="cw-res hm" style={vd("2.4s")}>
                      <span className="cw-av">TK</span>
                      <div className="cw-rinfo"><b>Teknisi AC 24 Jam</b><span>Servis AC · mulai Rp60.000</span></div>
                      <span className="cw-wa"><MessageCircle />WA</span>
                    </div>
                    <div className="cw-map hm" style={vd("2.7s")}>
                      <span className="cw-pin hm" style={{ left: "26%", top: "38%", ...vd("3s") }} />
                      <span className="cw-pin cw-pin-near hm" style={{ left: "56%", top: "55%", ...vd("3.2s") }} />
                      <span className="cw-pin hm" style={{ left: "42%", top: "26%", ...vd("3.4s") }} />
                      <span className="cw-maplabel">teknisi terdekat</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 2: Pilih (kartu flip) */}
              <div ref={(el) => { panelRefs.current[1] = el; }} className="cw-panel" aria-hidden="true">
                <div className="f-wrap">
                  <span className="f-chip f-c1">★ 4.9 · 127 ulasan</span>
                  <span className="f-chip f-c2">Kec. Kebumen</span>
                  <div className="f-flip">
                    <div className="f-flipin">
                      <div className="f-face">
                        <span className="f-badge hm" style={vd("1s")}><BadgeCheck />Terverifikasi</span>
                        <span className="f-av">AS</span>
                        <b className="f-name">AC Sejahtera</b>
                        <span className="f-cat">Servis AC &amp; elektronik</span>
                        <span className="f-div" />
                        <div className="f-stars">
                          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                          <b className="f-score">4.9</b>
                        </div>
                        <span className="f-price">mulai Rp75.000</span>
                      </div>
                      <div className="f-face f-back">
                        <b className="f-bt">Kurasi tim JasaKebumen</b>
                        <div className="f-check hm" style={vd("3.9s")}><i>✓</i>Identitas pemilik usaha</div>
                        <div className="f-check hm" style={vd("4.35s")}><i>✓</i>Portofolio pekerjaan</div>
                        <div className="f-check hm" style={vd("4.8s")}><i>✓</i>Nomor WA aktif &amp; responsif</div>
                        <span className="f-seal" style={vd("5.3s")}>LOLOS KURASI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 3: Chat WhatsApp */}
              <div ref={(el) => { panelRefs.current[2] = el; }} className="cw-panel" aria-hidden="true">
                <div className="ph">
                  <div className="ph-screen">
                    <div className="ph-head">
                      <span className="ph-av">AS</span>
                      <div><b>AC Sejahtera</b><span>online</span></div>
                      <span className="ph-call"><Phone /></span>
                    </div>
                    <div className="ph-body">
                      <div className="c-bub c-in hm" style={vd(".5s")}>
                        Bang, AC ruang tamu tidak dingin. Bisa dicek hari ini?
                        <span className="c-meta">09.38</span>
                      </div>
                      <div className="c-bub c-in hm" style={vd("1.2s")}>
                        Bisa. Teknisi datang jam 9 ya.
                        <span className="c-meta">09.39</span>
                      </div>
                      <div className="c-type"><i /><i /><i /></div>
                      <div className="c-bub c-out hm" style={vd("3.4s")}>
                        Siap bang, ditunggu.
                        <span className="c-meta hm" style={vd("4.3s")}><b>✓✓</b> 09.41</span>
                      </div>
                    </div>
                    <div className="ph-input">
                      <span>Ketik pesan…</span>
                      <span className="ph-send"><Send /></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEP_COLS.map((col, j) => (
              <div
                key={j}
                ref={(el) => { colRefs.current[j] = el; }}
                data-stepcol
                className={`border-t-2 pt-5 transition-all duration-300 ${j === 0 ? "border-amber-400 opacity-100" : "border-white/10 opacity-40"}`}
              >
                <p className="font-mono text-xs text-amber-300/80">{col.n}</p>
                <h3 className="mt-2.5 text-lg font-semibold tracking-tight">{col.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{col.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
