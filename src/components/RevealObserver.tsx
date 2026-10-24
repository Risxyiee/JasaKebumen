"use client";

/**
 * RevealObserver — pengamat global untuk elemen ber-atribut `data-reveal`.
 *
 * CSS globals.css menyembunyikan [data-reveal] (opacity 0 + translateY)
 * sampai kelas .is-visible ditambahkan saat elemen masuk viewport.
 * Dulunya tidak ada komponen yang mengamatinya → section CTAhomepage
 * tidak pernah muncul. Dipasang sekali di root halaman utama.
 */

import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";

export default function RevealObserver() {
  const reduce = useReducedMotion();

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;

    /* Hormati preferensi reduce-motion: langsung tampil tanpa animasi */
    if (reduce || typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            obs.unobserve(en.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => obs.observe(el));

    /* Elemen yang muncul belakangan (mitra baru dirender ulang) ikut diamati */
    const mut = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.hasAttribute("data-reveal")) obs.observe(n);
          n.querySelectorAll?.("[data-reveal]").forEach((c) => obs.observe(c));
        });
      }
    });
    mut.observe(document.body, { childList: true, subtree: true });

    return () => { obs.disconnect(); mut.disconnect(); };
  }, [reduce]);

  return null;
}
