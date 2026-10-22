"use client";

import { MessageCircle } from "lucide-react";
import { trackWaClick } from "@/lib/track";

/**
 * Tombol "Chat WhatsApp" yang bisa dipakai di halaman server component
 * (halaman profil, Pojok Kemasan & Desain, dst.) — klik dihitung sebagai
 * KPI PRD. source: asal klik untuk analitik admin.
 */
export default function WaChatButton({
  providerId,
  href,
  source = "profil",
  className,
  label = "Chat WhatsApp",
}: {
  providerId: string;
  href: string;
  source?: "direktori" | "profil";
  className?: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWaClick(providerId, source)}
      aria-label="Chat pemilik usaha via WhatsApp"
      className={
        className ??
        "inline-flex items-center gap-2 rounded-lg bg-green px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-dark"
      }
    >
      <MessageCircle className="h-4 w-4" /> {label}
    </a>
  );
}
