"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageCircle,
  Phone,
  Send,
  User,
  FileText,
  MapPin,
  Tag,
} from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface District {
  id: string;
  name: string;
  slug: string;
}

type FormState = "idle" | "submitting" | "success" | "error";

export default function DaftarPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [description, setDescription] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/districts").then((r) => r.json()),
    ])
      .then(([catRes, distRes]) => {
        setCategories(catRes.categories || []);
        setDistricts(distRes.districts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          categoryId,
          districtId,
          description,
          whatsappNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Terjadi kesalahan.");
        setFormState("error");
        return;
      }

      setFormState("success");
    } catch {
      setErrorMsg("Gagal mengirim. Periksa koneksi internet Anda.");
      setFormState("error");
    }
  };

  if (formState === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-tint">
            <CheckCircle2 className="h-10 w-10 text-green" />
          </div>
          <h1 className="font-serif text-3xl text-ink">Pendaftaran Terkirim!</h1>
          <p className="mt-3 text-mute leading-relaxed">
            Terima kasih sudah mendaftar. Tim kami akan meninjau data Anda dan
            menghubungi via WhatsApp jika perlu verifikasi.
          </p>
          <p className="mt-2 text-sm text-faint">
            Biasanya proses kurasi memakan waktu 1–2 hari kerja.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-line"
            >
              Kembali ke Beranda
            </Link>
            <Link
              href="/daftar"
              onClick={() => {
                setFormState("idle");
                setName("");
                setCategoryId("");
                setDistrictId("");
                setDescription("");
                setWhatsappNumber("");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-dark"
            >
              Daftar Mitra Lain
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-5">
          <Link href="/" className="flex items-center gap-2 text-green transition hover:opacity-80">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="currentColor" />
              <path
                d="M12 5c-2.5 0-4.5 2-4.5 4.5C7.5 13 12 19 12 19s4.5-6 4.5-9.5C16.5 7 14.5 5 12 5z"
                fill="white"
              />
            </svg>
            <span className="font-serif text-lg font-semibold text-ink">JasaKebumen</span>
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        {/* Title */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-tint px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-green">
            <Send className="h-3 w-3" /> Pendaftaran Mitra
          </span>
          <h1 className="mt-4 font-serif text-3xl text-ink md:text-4xl">
            Daftarkan Jasa Anda
          </h1>
          <p className="mt-2 text-mute leading-relaxed">
            Gratis, tanpa biaya. Isi formulir di bawah dan tim kami akan
            meninjau pendaftaran Anda sebelum ditampilkan ke publik.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-faint" />
              <span className="ml-3 text-mute">Memuat formulir…</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                  <User className="h-4 w-4 text-faint" /> Nama Usaha / Mitra
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: AC Sejahtera"
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
                />
              </div>

              {/* Category & District row */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="category" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                    <Tag className="h-4 w-4 text-faint" /> Kategori Jasa
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="mt-1 w-full appearance-none rounded-lg border border-line bg-paper px-4 py-2.5 pr-10 text-sm text-ink outline-none transition focus:border-green focus:ring-2 focus:ring-green/15"
                    >
                      <option value="">Pilih kategori…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-[calc(50%+2px)] h-4 w-4 -translate-y-1/2 text-faint" />
                  </div>
                </div>

                <div>
                  <label htmlFor="district" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                    <MapPin className="h-4 w-4 text-faint" /> Kecamatan
                  </label>
                  <div className="relative">
                    <select
                      id="district"
                      required
                      value={districtId}
                      onChange={(e) => setDistrictId(e.target.value)}
                      className="mt-1 w-full appearance-none rounded-lg border border-line bg-paper px-4 py-2.5 pr-10 text-sm text-ink outline-none transition focus:border-green focus:ring-2 focus:ring-green/15"
                    >
                      <option value="">Pilih kecamatan…</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-[calc(50%+2px)] h-4 w-4 -translate-y-1/2 text-faint" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                  <FileText className="h-4 w-4 text-faint" /> Deskripsi Layanan
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan layanan yang Anda tawarkan, pengalaman, area layanan, dll."
                  className="mt-1 w-full resize-none rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
                />
                <p className="mt-1 text-xs text-faint">
                  Opsional — tapi membantu calon pelanggan mengenal layanan Anda.
                </p>
              </div>

              {/* WhatsApp */}
              <div>
                <label htmlFor="wa" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                  <MessageCircle className="h-4 w-4 text-faint" /> Nomor WhatsApp
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="shrink-0 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-faint">
                    +62
                  </span>
                  <input
                    id="wa"
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="81270001001"
                    className="w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
                  />
                </div>
                <p className="mt-1 text-xs text-faint">
                  Pelanggan akan menghubungi Anda lewat WhatsApp.
                </p>
              </div>

              {/* Error */}
              {formState === "error" && errorMsg && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={formState === "submitting"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formState === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Mengirim…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Kirim Pendaftaran
                  </>
                )}
              </button>

              <p className="text-center text-xs text-faint">
                Dengan mendaftar, Anda menyetujui bahwa data di atas benar dan dapat diverifikasi oleh tim JasaKebumen.
              </p>
            </form>
          )}
        </div>

        {/* Bottom info */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Phone, label: "Gratis", desc: "Tidak ada biaya pendaftaran" },
            { icon: CheckCircle2, label: "Dikurasi", desc: "Tim kami verifikasi data" },
            { icon: MessageCircle, label: "WhatsApp", desc: "Pelanggan hubungi langsung" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-tint">
                <item.icon className="h-4 w-4 text-green" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{item.label}</p>
                <p className="text-xs text-faint">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
