"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Star, Send, CheckCircle2 } from "lucide-react";
import Turnstile from "@/components/Turnstile";

/**
 * Form ulasan publik di halaman profil usaha.
 * Rating bintang 1–5 + nama + komentar → masuk sebagai "pending",
 * tayang setelah admin approve. Anti-bot: honeypot `website` + Turnstile
 * (widget hanya muncul bila TURNSTILE_SITE_KEY sudah diaktifkan) +
 * rate limit per-IP di server.
 */
export default function ReviewForm({ providerId }: { providerId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [tsSiteKey, setTsSiteKey] = useState("");
  const [tsToken, setTsToken] = useState("");
  const [tsReset, setTsReset] = useState(0);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const openForm = async () => {
    setOpen(true);
    if (!tsSiteKey) {
      /* Site key diminta saat form dibuka — tidak membebani halaman profil */
      try {
        const r = await fetch("/api/turnstile").then((x) => x.json());
        if (typeof r?.siteKey === "string" && r.siteKey) setTsSiteKey(r.siteKey);
      } catch {
        /* gagal → form tetap terbuka tanpa widget (server degrade terbuka) */
      }
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (rating < 1) {
      setError("Pilih rating bintang dulu (1–5).");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/providers/${providerId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, comment, website: honeypot, turnstileToken: tsToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.error || "Gagal mengirim ulasan. Coba lagi.");
        /* Token Turnstile sekali pakai — reset widget */
        setTsReset((n) => n + 1);
      }
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-green/20 bg-green-tint p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green" />
        <div>
          <p className="font-medium text-ink">Terima kasih, ulasanmu sudah terkirim!</p>
          <p className="mt-1 text-sm text-mute">
            Ulasan akan tayang setelah diperiksa tim kurasi kami (biasanya 1–2 hari).
          </p>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openForm}
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-green/30 px-4 py-2.5 text-sm font-semibold text-green transition hover:border-green hover:bg-green hover:text-white"
      >
        <Star className="h-4 w-4" /> Tulis ulasan
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-xl border border-line bg-white p-5">
      <p className="font-serif text-lg text-ink">Bagaimana pengalamanmu?</p>
      <p className="mt-1 text-xs text-mute">
        Ulasan hanya untuk pelanggan yang benar-benar pernah dilayani.
      </p>

      {/* Rating bintang */}
      <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} bintang`}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                (hover || rating) >= n
                  ? "fill-amber-400 text-amber-400"
                  : "text-stone-300"
              }`}
            />
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          required
          minLength={2}
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Namamu"
          className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
        />
        {/* Honeypot — tersembunyi dari manusia */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      <textarea
        required
        minLength={4}
        maxLength={600}
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Ceritakan pengalamanmu: apakah hasilnya bagus, sopan, dan tepat waktu?"
        className="mt-3 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
      />

      {tsSiteKey && (
        <Turnstile siteKey={tsSiteKey} onToken={setTsToken} resetSignal={tsReset} />
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-dark disabled:opacity-50"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Kirim ulasan
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-mute underline underline-offset-4 hover:text-ink"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
