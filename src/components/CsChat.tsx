"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { waAdminLink } from "@/lib/data";

/**
 * CS bot widget — pojok kanan bawah, seluruh situs.
 *
 * Menangani pertanyaan umum secara otomatis (FAQ berbasis kata kunci,
 * cepat & tanpa biaya API). Pertanyaan yang tidak dikenal disimpan ke DB
 * (diam-diam) supaya owner tahu apa yang dicari pengunjung, dan pengunjung
 * bisa menitipkan pesan + nomor WA untuk dihubungi admin.
 *
 * Semua pesan menitipan memicu notifikasi Telegram ke owner (server-side).
 */

type Msg = { role: "bot" | "user"; text: string };

type Chip =
  | { kind: "ask"; label: string } // kirim teks ini sebagai pertanyaan → dicocokkan ke FAQ
  | { kind: "link"; label: string; href: string; external?: boolean }
  | { kind: "lead"; label: string }; // mulai alur tinggalkan pesan

type Phase = "chat" | "lead_name" | "lead_contact" | "lead_text";

const SESSION_KEY = "jk_cs_session";

const GREETING =
  "Halo! Aku CS JasaKebumen, asisten otomatis. Mau tanya apa hari ini?";

const OPENING_CHIPS: Chip[] = [
  { kind: "ask", label: "Cara daftar usaha" },
  { kind: "ask", label: "Apakah bayar?" },
  { kind: "ask", label: "Cari jasa" },
  { kind: "lead", label: "Tinggalkan pesan" },
];

const FALLBACK_CHIPS: Chip[] = [
  { kind: "ask", label: "Cara daftar usaha" },
  { kind: "ask", label: "Apakah bayar?" },
  { kind: "lead", label: "Tinggalkan pesan" },
  { kind: "link", label: "Chat admin via WhatsApp", external: true, href: waAdminLink("Halo Admin JasaKebumen, saya butuh bantuan.") },
];

/** Pencocokan FAQ berbasis kata kunci — deterministic, tanpa biaya. */
function matchFaq(q: string): { reply: string; chips: Chip[] } | null {
  const t = q.toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => t.includes(k));

  if (has("daftar", "gabung", "ikut", "posting", "bikin usaha", "buat usaha", "masuk")) {
    return {
      reply:
        "Pendaftaran sangat mudah dan gratis: buka halaman Daftar Usaha, isi nama usaha, kategori, kecamatan, nomor WhatsApp, deskripsi, dan hingga 3 foto usaha. Tim kami kurasi dulu (biasanya 1-2 hari kerja), setelah tayang kamu langsung punya halaman profil lengkap dengan link yang bisa dibagikan.",
      chips: [
        { kind: "link", label: "Buka halaman pendaftaran", href: "/daftar" },
        { kind: "ask", label: "Apakah bayar?" },
      ],
    };
  }

  if (has("biaya", "bayar", "gratis", "komisi", "pungut", "iuran", "mahal")) {
    return {
      reply:
        "Gratis 100%. Tidak ada biaya pendaftaran, tidak ada langganan, dan tidak ada komisi per transaksi. Semua pembayaran dari pelanggan masuk langsung ke kamu — kami hanya membantu pelanggan menemukan usahamu.",
      chips: [
        { kind: "ask", label: "Cara daftar usaha" },
        { kind: "ask", label: "Bagaimana proses verifikasi?" },
      ],
    };
  }

  if (has("cari", "butuh", "jasa", "tukang", "teknisi", "servis", "perbaiki", "benerin", "tanya harga")) {
    return {
      reply:
        "Kamu bisa cari jasa di halaman utama: ketik kata kunci di kolom pencarian atau pilih kategori (servis AC, servis laptop, rental mobil, cleaning & laundry, fotografer, listrik & CCTV, tukang renovasi, barbershop). Bisa juga difilter per kecamatan. Ketuk nama usaha untuk melihat profil, foto, dan ulasannya.",
      chips: [
        { kind: "link", label: "Lihat direktori jasa", href: "/#penyedia" },
        { kind: "ask", label: "Apakah usahanya terverifikasi?" },
      ],
    };
  }

  if (has("verifikasi", "kurasi", "aman", "percaya", "asli", "tipu")) {
    return {
      reply:
        "Setiap usaha diperiksa tim kami sebelum tayang: nama, deskripsi, foto, dan nomor WhatsApp-nya. Profil yang lolos kurasi mendapat badge terverifikasi, dan pelanggan bisa membaca ulasan asli dari pengguna sebelumnya.",
      chips: [
        { kind: "link", label: "Lihat direktori jasa", href: "/#penyedia" },
        { kind: "ask", label: "Cara daftar usaha" },
      ],
    };
  }

  if (has("lama", "kapan", "proses", "aktif", "tayang", "disetujui", "approve")) {
    return {
      reply:
        "Kurasi pendaftaran biasanya selesai dalam 1-2 hari kerja. Kamu akan tahu usahamu sudah tayang ketika profilmu muncul di direktori. Kalau sudah lebih dari 2 hari, silakan hubungi admin lewat WhatsApp.",
      chips: [
        { kind: "link", label: "Chat admin via WhatsApp", external: true, href: waAdminLink("Halo Admin JasaKebumen, mau tanya status pendaftaran usaha saya.") },
        { kind: "lead", label: "Tinggalkan pesan" },
      ],
    };
  }

  if (has("ulasan", "rating", "bintang", "review")) {
    return {
      reply:
        "Setiap profil usaha punya bagian ulasan. Pelanggan yang pernah dilayani bisa memberi bintang 1-5 dan komentar. Ulasan dimoderasi dulu oleh tim kami supaya jujur dan relevan, lalu otomatis menaikkan rating usaha di direktori.",
      chips: [{ kind: "link", label: "Lihat direktori jasa", href: "/#penyedia" }],
    };
  }

  if (has("admin", "manusia", "orang", "cs", "customer service", "hubungi", "kontak", "bicara")) {
    return {
      reply:
        "Tentu, kamu bisa langsung bicara dengan admin kami. Pilih cara yang paling nyaman:",
      chips: [
        { kind: "link", label: "Chat admin via WhatsApp", external: true, href: waAdminLink("Halo Admin JasaKebumen, saya butuh bantuan.") },
        { kind: "lead", label: "Tinggalkan pesan (dibales via WA)" },
      ],
    };
  }

  if (has("halo", "hai", "hello", "pagi", "siang", "sore", "malam", "assalam")) {
    return {
      reply:
        "Halo juga! Senang bertemu kamu. Ada yang bisa dibantu tentang JasaKebumen?",
      chips: OPENING_CHIPS,
    };
  }

  if (has("terima kasih", "makasih", "thanks", "oke", "ok", "sip")) {
    return {
      reply: "Sama-sama! Kalau nanti butuh apa-apa lagi, aku di sini ya.",
      chips: OPENING_CHIPS,
    };
  }

  return null;
}

export default function CsChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("chat");
  const [lead, setLead] = useState({ name: "", contact: "" });
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  /* Sesi stabil per pengunjung — supaya inbox admin bisa mengelompokkan */
  useEffect(() => {
    try {
      let s = localStorage.getItem(SESSION_KEY);
      if (!s) {
        s = `cs-${crypto.randomUUID()}`;
        localStorage.setItem(SESSION_KEY, s);
      }
      setSessionId(s);
    } catch {
      setSessionId(`cs-${Math.random().toString(36).slice(2)}`);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, chips, open]);

  const pushBot = (text: string, nextChips: Chip[]) => {
    setMsgs((m) => [...m, { role: "bot", text }]);
    setChips(nextChips);
  };

  const openChat = () => {
    setOpen(true);
    if (msgs.length === 0) pushBot(GREETING, OPENING_CHIPS);
  };

  /* Simpan pesan ke DB (inbox admin + notif Telegram). Silent — UX tidak tergantung. */
  const saveToDb = (payload: { text: string; name?: string; contact?: string }) => {
    if (!sessionId) return;
    fetch("/api/cs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, ...payload }),
    }).catch(() => {});
  };

  const submitLead = async (finalText: string) => {
    setSending(true);
    try {
      const res = await fetch("/api/cs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, name: lead.name, contact: lead.contact, text: finalText }),
      });
      if (res.ok) {
        pushBot(
          `Terkirim! Admin akan membalas ke nomor WhatsApp-mu (${lead.contact}). Ada lagi yang bisa kubantu?`,
          OPENING_CHIPS
        );
      } else {
        pushBot(
          "Waduh, pesanmu gagal terkirim. Coba lagi, atau langsung chat admin via WhatsApp ya.",
          FALLBACK_CHIPS
        );
      }
    } catch {
      pushBot(
        "Koneksi bermasalah, pesanmu gagal terkirim. Coba lagi atau chat admin via WhatsApp.",
        FALLBACK_CHIPS
      );
    } finally {
      setSending(false);
      setPhase("chat");
      setLead({ name: "", contact: "" });
    }
  };

  const handleUserText = (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setChips([]);

    /* Alur titip pesan: tangkap satu per satu */
    if (phase === "lead_name") {
      setLead((l) => ({ ...l, name: text.slice(0, 60) }));
      setPhase("lead_contact");
      pushBot(
        `Senang berkenalan, ${text.slice(0, 60)}! Mau ditelepon/di-WA di nomor berapa? Tulis nomor WhatsApp-mu (contoh: 0812xxxxxxx).`,
        []
      );
      return;
    }
    if (phase === "lead_contact") {
      const digits = text.replace(/\D/g, "");
      if (digits.length < 9 || digits.length > 15) {
        pushBot("Hmm, nomornya kelihatan belum lengkap. Coba tulis lagi ya (contoh: 0812xxxxxxx).", []);
        return;
      }
      setLead((l) => ({ ...l, contact: digits }));
      setPhase("lead_text");
      pushBot("Siap. Sekarang tulis pesanmu untuk admin:", []);
      return;
    }
    if (phase === "lead_text") {
      void submitLead(text);
      return;
    }

    /* Mode chat biasa: cocokkan ke FAQ */
    const hit = matchFaq(text);
    if (hit) {
      pushBot(hit.reply, hit.chips);
    } else {
      /* Tidak dikenal → simpan sebagai masukan owner + tawarkan manusia */
      saveToDb({ text });
      pushBot(
        "Maaf, aku belum paham maksudnya. Pilih topik di bawah, atau tinggalkan pesan biar admin kami yang membalas via WhatsApp.",
        FALLBACK_CHIPS
      );
    }
  };

  const pickChip = (chip: Chip) => {
    if (chip.kind === "link") {
      if (chip.external) {
        window.open(chip.href, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = chip.href;
      }
      return;
    }
    setMsgs((m) => [...m, { role: "user", text: chip.label }]);
    setChips([]);

    if (chip.kind === "lead") {
      setPhase("lead_name");
      pushBot("Baik! Siapa nama panggilanmu?", []);
      return;
    }

    const hit = matchFaq(chip.label);
    if (hit) pushBot(hit.reply, hit.chips);
    else pushBot(GREETING, OPENING_CHIPS);
  };

  return (
    <>
      {/* Panel chat */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/20 sm:right-5">
          {/* Header */}
          <div className="flex items-center justify-between bg-green px-4 py-3 text-black">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 font-serif text-sm font-bold">
                J
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">CS JasaKebumen</p>
                <p className="flex items-center gap-1.5 text-[11px] text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Online · jawab instan
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup chat"
              className="rounded-lg p-1.5 transition hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Isi chat */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-paper px-4 py-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-md bg-green text-black"
                      : "rounded-bl-md border border-line bg-surface text-ink"
                  }`}
                >
                  {m.text}
                </p>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <span className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2.5 text-xs text-mute">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengirim…
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-line bg-surface px-4 pt-3">
              {chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => pickChip(c)}
                  className="rounded-full border border-green/30 px-3 py-1.5 text-xs font-medium text-green transition hover:bg-green hover:text-black"
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-line bg-surface px-3 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUserText(input);
              }}
              placeholder={
                phase === "chat" ? "Tulis pertanyaanmu…" : "Tulis jawabanmu…"
              }
              className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
            />
            <button
              type="button"
              onClick={() => handleUserText(input)}
              disabled={!input.trim() || sending}
              aria-label="Kirim"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green text-black transition hover:bg-green-dark disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openChat())}
        aria-label={open ? "Tutup CS chat" : "Buka CS chat"}
        className="fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full bg-green text-black shadow-lg shadow-black/15 ring-1 ring-white/20 transition hover:bg-green-dark"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </>
  );
}
