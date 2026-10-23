"use client";

import { useEffect, useRef } from "react";

/**
 * Widget Cloudflare Turnstile (render explicit) untuk form publik.
 *
 * Tidak dirender sama sekali bila `siteKey` kosong — artinya Turnstile
 * belum diaktifkan di dashboard, dan form tetap berjalan hanya dengan
 * honeypot + rate limit (degrade aman).
 *
 * Token Turnstile sekali pakai: setelah submit GAGAL, form harus me-reset
 * widget — cukup naikkan `resetSignal` (mis. dari 0 ke 1) dan token state
 * di form ikut dikosongkan otomatis.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export default function Turnstile({
  siteKey,
  onToken,
  resetSignal = 0,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  resetSignal?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  /* Selalu panggil callback terbaru tanpa me-render ulang widget */
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  /* Muat script (sekali per halaman) lalu render widget */
  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;

    const render = () => {
      if (
        cancelled ||
        !containerRef.current ||
        !window.turnstile ||
        widgetIdRef.current !== null
      ) {
        return;
      }
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => onTokenRef.current(""),
          theme: "light",
        });
      } catch {
        /* render gagal (mis. diblok ekstensi) → form tetap bisa dicoba */
      }
    };

    if (window.turnstile) {
      render();
    } else {
      let script = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`
      );
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
      return () => {
        cancelled = true;
        script?.removeEventListener("load", render);
      };
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* abaikan */
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  /* Reset dari luar setelah submit gagal — token lama sudah terpakai */
  useEffect(() => {
    if (resetSignal === 0) return;
    onTokenRef.current("");
    if (widgetIdRef.current !== null && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        /* abaikan */
      }
    }
  }, [resetSignal]);

  if (!siteKey) return null;

  return (
    <div
      ref={containerRef}
      aria-label="Verifikasi keamanan"
      className="min-h-[65px]"
    />
  );
}
