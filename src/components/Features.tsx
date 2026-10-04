"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { Asterisk, MessageCircle, Search } from "lucide-react";
import Reveal from "./Reveal";
import { PROVIDERS, type Provider } from "@/lib/data";

const DEMO_QUERIES = ["servis ac", "tukang listrik", "fotografer", "laundry"];
const chipsFor = (q: string) =>
  PROVIDERS.filter((p) => (p.keywords + " " + p.cat).toLowerCase().includes(q)).slice(0, 3);

const vd = (v: string) => ({ "--d": v }) as React.CSSProperties;

export default function Features() {
  const secRef = useRef<HTMLElement>(null);
  const inView = useInView(secRef, { margin: "200px 0px" });
  const startedRef = useRef(false);
  const [typed, setTyped] = useState("");
  const [chips, setChips] = useState<Provider[]>([]);

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      let i = 0;
      while (!cancelled) {
        const q = DEMO_QUERIES[i % DEMO_QUERIES.length];
        setTyped("");
        for (const ch of q) {
          if (cancelled) return;
          setTyped((t) => t + ch);
          await sleep(70 + Math.random() * 55);
        }
        await sleep(400);
        if (cancelled) return;
        setChips(chipsFor(q));
        await sleep(2800);
        if (cancelled) return;
        setChips([]);
        for (let k = q.length; k >= 0; k--) {
          if (cancelled) return;
          setTyped(q.slice(0, k));
          await sleep(32);
        }
        await sleep(280);
        i++;
      }
    })();
    return () => { cancelled = true; };
  }, [inView]);

  return (
    <section id="fitur" ref={secRef} className="scroll-mt-20 bg-green-dark text-white">
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
        <span aria-hidden className="pointer-events-none absolute right-4 top-8 hidden select-none font-serif text-[9rem] leading-none text-white/[0.04] lg:block">01</span>

        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
                <Asterisk className="h-3 w-3 text-amber-300" />01 — Fitur
              </p>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl">Semua yang bikin cari jasa tenang.</h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/60">
              Bukan cuma daftar nomor — platform ini punya mekanisme yang membuat kamu yakin sebelum menghubungi.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-3 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-amber-300" />
                <h3 className="font-semibold tracking-tight">Pencarian yang hidup</h3>
              </div>
              <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-white/10 px-3.5 py-3">
                <Search className="h-4 w-4 shrink-0 text-white/40" />
                <span id="demoType" className="font-mono text-sm text-white/90">{typed}</span>
                <span className="demo-caret" aria-hidden />
              </div>
              <div id="demoChips" className="mt-3 flex min-h-[4.4rem] flex-wrap content-start gap-2">
                {chips.map((p, j) => (
                  <span
                    key={p.id}
                    className="chip rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/85"
                    style={{ animationDelay: `${j * 110}ms` }}
                  >
                    {p.name} · Kec. {p.district}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                Hasil muncul seketika saat kamu mengetik — tanpa reload, tanpa akun. Coba versi aslinya di kolom pencarian atas.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 text-amber-300" />
                <h3 className="font-semibold tracking-tight">Langsung WhatsApp</h3>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="cb cb-1 max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-3.5 py-2">Bang, AC saya bocor. Bisa dicek hari ini?</div>
                <div className="cb cb-2 max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-3.5 py-2">Bisa. Jam 9 pagi sampai rumah ya.</div>
                <div className="cb cb-3 ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-green px-3.5 py-2 text-white">Siap bang, ditunggu.</div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/50">
                Nego harga dan jadwal langsung dengan mitra. Kami tidak di tengah, tidak ambil potongan.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="group flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="stage" aria-hidden>
                <div className="idc"><span className="iav" /><span className="il1" /><span className="il2" /></div>
                <span className="iscan" />
                <span className="ick">✓</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold tracking-tight">Kurasi manusia</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                  Identitas, portofolio pekerjaan, dan nomor WA dicek tim sebelum profil tayang.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.07}>
            <div className="group flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="stage" aria-hidden>
                <span className="tagn" />
                <span className="tagp">Rp75</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold tracking-tight">Harga mulai tertera</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                  Tahu kisaran biaya dari profil — tidak ada kejutan harga saat chat pertama.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="group flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="stage" aria-hidden>
                <div className="mmap"><i className="r1" /><i className="r2" /><i className="v1" />
                  <span className="mp" style={{ left: "24%", top: "30%", ...vd("0s") }} />
                  <span className="mp" style={{ left: "62%", top: "24%", ...vd(".35s") }} />
                  <span className="mp" style={{ left: "40%", top: "66%", ...vd(".7s") }} />
                  <span className="mp near" style={{ left: "76%", top: "62%", ...vd("1.05s") }} />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold tracking-tight">Filter 28 kecamatan</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                  Dari Kebumen kota sampai Ayah dan Rowokele — cari mitra yang paling dekat.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-3">
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="stage" aria-hidden>
                <div className="brw">
                  <div className="bbar"><b /><b /><b /><span className="u" /></div>
                  <span className="bl bl1" /><span className="bl bl2" /><span className="bl bl3" />
                </div>
              </div>
              <p className="text-sm leading-relaxed text-white/70">
                <strong className="font-semibold text-white">Tanpa aplikasi &amp; tanpa akun.</strong> Buka browser, cari, chat — selesai. Halaman ini ringan, hemat kuota, dan jalan di HP kentang sekalipun.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
