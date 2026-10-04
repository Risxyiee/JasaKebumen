"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const header = headerRef.current;
        if (header) {
          header.classList.toggle("is-scrolled", window.scrollY > 4);
        }
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
    <>
      <div id="progress" className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-amber-400" style={{ transform: `scaleX(${progress})` }} />

      <header id="siteHeader" ref={headerRef} className="fixed inset-x-0 top-0 z-50 bg-paper/90 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#" className="flex items-center gap-2">
            <Image
              src="/logo-sm.png"
              alt="JasaKebumen"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
            <span className="font-semibold tracking-tight">JasaKebumen</span>
          </a>

          <div className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-mute transition hover:text-ink">
                {l.label}
              </a>
            ))}
            <Link
              href="/daftar"
              className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-dark"
            >
              Daftar usaha
            </Link>
          </div>

          <button
            id="menuBtn"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line md:hidden"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
          >
            {open ? <X className="menu-close h-5 w-5" /> : <Menu className="menu-open h-5 w-5" />}
          </button>
        </nav>

        <div id="mobileMenu" className={`${open ? "" : "hidden"} border-t border-line bg-paper md:hidden`}>
          <nav className="flex flex-col px-5 py-4 text-[15px]">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="js-mnav py-2.5">
                {l.label}
              </a>
            ))}
            <Link
              href="/daftar"
              onClick={() => setOpen(false)}
              className="js-mnav mt-2 rounded-lg bg-green px-4 py-3 text-center font-semibold text-white"
            >
              Daftar usaha
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
