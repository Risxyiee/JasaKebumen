"use client";

import { useEffect, useState } from "react";
import { MapPin, Menu, X } from "lucide-react";
import { waAdminLink } from "@/lib/data";

const LINKS = [
  { href: "#fitur", label: "Fitur" },
  { href: "#kategori", label: "Kategori" },
  { href: "#penyedia", label: "Penyedia" },
  { href: "#cara", label: "Cara kerja" },
  { href: "#faq", label: "FAQ" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 4);
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        setProgress(max > 0 ? h.scrollTop / max : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-paper/90 backdrop-blur-sm transition-colors ${
        scrolled ? "border-b border-line" : "border-b border-transparent"
      }`}
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5 origin-left bg-amber-400"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />

      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#" className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-[7px] bg-green text-white">
            <MapPin className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold tracking-tight">JasaKebumen</span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-mute transition hover:text-ink">
              {l.label}
            </a>
          ))}
          <a
            href={waAdminLink("Halo Admin JasaKebumen, saya ingin mendaftarkan usaha jasa.")}
            target="_blank" rel="noopener noreferrer"
            className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-dark"
          >
            Daftar usaha
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line md:hidden"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <nav className="border-t border-line bg-paper md:hidden">
          <div className="flex flex-col px-5 py-4 text-[15px]">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2.5">
                {l.label}
              </a>
            ))}
            <a
              href={waAdminLink("Halo Admin JasaKebumen, saya ingin mendaftarkan usaha jasa.")}
              target="_blank" rel="noopener noreferrer"
              className="mt-2 rounded-lg bg-green px-4 py-3 text-center font-semibold text-white"
            >
              Daftar usaha
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
