"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/**
 * Tombol bagikan profil: pakai Web Share API bila tersedia (HP),
 * fallback salin link ke clipboard (desktop) + konfirmasi visual.
 */
export default function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const abs = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url: abs });
        return;
      }
      await navigator.clipboard.writeText(abs);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // user batal share (AbortError) — abaikan
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-mute transition hover:border-green/40 hover:text-green"
    >
      {copied ? <Check className="h-4 w-4 text-green" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Link disalin!" : "Bagikan"}
    </button>
  );
}
