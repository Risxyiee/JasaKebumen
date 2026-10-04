"use client";

import { MessageCircle } from "lucide-react";
import { waLink, type Provider } from "@/lib/data";

interface Props {
  provider: Provider;
  className?: string;
  label?: string;
}

export default function WhatsAppButton({ provider, className, label = "WhatsApp" }: Props) {
  const handleClick = () => {
    // TODO: Send tracking ping to Supabase: providerId clicked
    // await supabase.from("wa_clicks").insert({ provider_id: provider.id, clicked_at: new Date() });
  };

  return (
    <a
      href={waLink(provider)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={`Chat ${provider.name} via WhatsApp`}
      className={
        className ??
        "inline-flex items-center justify-center gap-2 rounded-lg border border-green/30 px-4 py-2 text-sm font-semibold text-green transition hover:border-green hover:bg-green hover:text-white"
      }
    >
      <MessageCircle className="h-4 w-4" /> {label}
    </a>
  );
}
