"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ImageIcon,
  Loader2,
  MessageCircle,
  Phone,
  Send,
  User,
  FileText,
  MapPin,
  Tag,
  TriangleAlert,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { REF_CATEGORIES, REF_DISTRICTS } from "@/lib/reference";
import Turnstile from "@/components/Turnstile";

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

const MAX_PHOTOS = 3;
const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024; // 15 MB sebelum dikompresi

/** Kompresi foto di browser: sisi terpanjang 1280px, JPEG kualitas 0.82.
    Hasilnya data URL ±100–300 KB — ringan untuk dikirim & disimpan. */
function compressImage(file: File, maxDim = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("format"));
    };
    img.src = url;
  });
}

export default function DaftarPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState(""); // alamat toko/workshop (opsional) — PRD: profil UMKM
  const [whatsappNumber, setWhatsappNumber] = useState("");

  /* Jenis kategori menentukan bentuk isian harga (sesuai permintaan:
     "tergantung kategori"). Kuliner = F&B → harga sesuai foto. */
  const selectedCat = categories.find((c) => c.id === categoryId);
  const isFnB = selectedCat?.slug === "kuliner";
  const isProduct = ["fashion-batik", "kerajinan", "kemasan-packaging"].includes(
    selectedCat?.slug || ""
  );
  /* Honeypot anti-spam: field tersembunyi — manusia tidak pernah mengisinya */
  const [honeypot, setHoneypot] = useState("");

  /* Turnstile (anti-bot lapisan 2) — siteKey dari /api/turnstile; kosong
     berarti belum diaktifkan di dashboard, widget tidak dirender. */
  const [tsSiteKey, setTsSiteKey] = useState("");
  const [tsToken, setTsToken] = useState("");
  const [tsReset, setTsReset] = useState(0);

  /* Foto usaha: maks 3, tersimpan sebagai data URL hasil kompresi */
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Keterangan harga — WAJIB (PRD: pembeli tahu harga sebelum menghubungi).
     Tampilan menyesuaikan kategori: kuliner/F&B = menu+harga per foto;
     produk = rentang harga; jasa = tarif mulai + keterangan per layanan. */
  const [priceMin, setPriceMin] = useState(""); // angka mentah, ditampilkan terformat
  const [priceMax, setPriceMax] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const [captions, setCaptions] = useState<string[]>([]); // sejajar dgn photos (F&B)

  const loadReference = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const results = await Promise.allSettled([
        fetch("/api/categories").then((r) => r.json()),
        fetch("/api/districts").then((r) => r.json()),
        fetch("/api/turnstile").then((r) => r.json()),
      ]);

      const [catRes, distRes, tsRes] = results.map((r) =>
        r.status === "fulfilled" ? r.value : null
      );

      const cats: Category[] = catRes?.categories?.length ? catRes.categories : REF_CATEGORIES;
      const dists: District[] = distRes?.districts?.length ? distRes.districts : REF_DISTRICTS;

      setCategories(cats);
      setDistricts(dists);
      if (typeof tsRes?.siteKey === "string" && tsRes.siteKey) setTsSiteKey(tsRes.siteKey);
      /* Gagal total (dua-duanya) → pakai fallback lokal, tapi beri tahu user */
      setLoadFailed(results.every((r) => r.status === "rejected"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReference();
  }, [loadReference]);

  const addPhotos = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // izinkan pilih file yang sama lagi
    if (!files.length) return;

    setPhotoError("");
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setPhotoError(`Maksimal ${MAX_PHOTOS} foto.`);
      return;
    }

    setPhotoBusy(true);
    const added: string[] = [];
    try {
      for (const file of files.slice(0, room)) {
        if (!file.type.startsWith("image/")) {
          setPhotoError("File harus berupa gambar (JPG/PNG/WebP).");
          continue;
        }
        if (file.size > MAX_ORIGINAL_BYTES) {
          setPhotoError("Foto terlalu besar (maks 15 MB).");
          continue;
        }
        try {
          added.push(await compressImage(file));
        } catch {
          setPhotoError("Format foto tidak didukung browser. Gunakan JPG/PNG.");
        }
      }
      if (added.length) {
        setPhotos((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
        /* Keterangan foto (F&B) harus sejajar dengan daftar foto */
        setCaptions((prev) => [...prev, ...added.map(() => "")].slice(0, MAX_PHOTOS));
      }
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setCaptions((prev) => prev.filter((_, i) => i !== idx));
    setPhotoError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormState("submitting");
    setErrorMsg("");

    /* Validasi keterangan harga (wajib) — cermin dari validasi server */
    const priceMinNum = Number(priceMin);
    if (!priceMin || !Number.isFinite(priceMinNum) || priceMinNum < 1) {
      setErrorMsg("Harga wajib diisi — tulis angka rupiah tanpa titik, misal 10000.");
      setFormState("error");
      document.getElementById("harga")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (priceMax && Number(priceMax) <= priceMinNum) {
      setErrorMsg("Harga tertinggi harus lebih besar dari harga termurah.");
      setFormState("error");
      document.getElementById("harga")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    /* F&B: harga harus sesuai foto — tiap foto wajib berketerangan menu + harga */
    if (isFnB && photos.length > 0 && photos.some((_, i) => !(captions[i] || "").trim())) {
      setErrorMsg("Kategori kuliner: isi keterangan menu + harga untuk setiap foto.");
      setFormState("error");
      document.getElementById("harga")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          categoryId,
          districtId,
          description,
          address,
          whatsappNumber,
          website: honeypot,
          images: photos,
          priceMin: priceMinNum,
          priceMax: priceMax ? Number(priceMax) : undefined,
          priceNote,
          imageCaptions: photos.map((_, i) => (captions[i] || "").trim()),
          turnstileToken: tsToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Terjadi kesalahan.");
        setFormState("error");
        /* Token Turnstile sekali pakai — reset widget supaya percobaan
           berikutnya dapat token baru */
        setTsReset((n) => n + 1);
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
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-line"
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
                setAddress("");
                setWhatsappNumber("");
                setPhotos([]);
                setCaptions([]);
                setPriceMin("");
                setPriceMax("");
                setPriceNote("");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark"
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
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-5">
          <Link href="/" className="flex items-center gap-2 text-green transition hover:opacity-80">
            <Image
              src="/logo-sm.png"
              alt="JasaKebumen"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
            <span className="font-semibold tracking-tight text-ink">JasaKebumen</span>
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
            Daftarkan Usaha Anda
          </h1>
          <p className="mt-2 text-mute leading-relaxed">
            Gratis, tanpa biaya. Isi formulir di bawah dan tim kami akan
            meninjau pendaftaran Anda sebelum ditampilkan ke publik.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm md:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-faint" />
              <span className="ml-3 text-mute">Memuat formulir…</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot — tersembunyi dari manusia, bot biasa mengisinya */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Peringatan: data referensi dari fallback lokal (server gagal dihubungi) */}
              {loadFailed && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <span className="inline-flex items-center gap-2">
                    <TriangleAlert className="h-4 w-4" />
                    Gagal memuat data dari server — memakai data bawaan. Anda tetap bisa mendaftar.
                  </span>
                  <button
                    type="button"
                    onClick={loadReference}
                    className="rounded-md border border-amber-300 bg-surface px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    Coba muat ulang
                  </button>
                </div>
              )}

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
                  placeholder="Misal: Lanting Bu Sri, Batik Kebumen Jaya"
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
                />
              </div>

              {/* Category & District row */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="category" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                    <Tag className="h-4 w-4 text-faint" /> Kategori Usaha
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

              {/* Alamat toko fisik (PRD: profil UMKM) */}
              <div>
                <label htmlFor="address" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                  <MapPin className="h-4 w-4 text-faint" /> Alamat toko / workshop{" "}
                  <span className="font-normal text-faint">(opsional)</span>
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Misal: Jl. Raya Gombong No. 12"
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
                />
                <p className="mt-1 text-xs text-faint">
                  Alamat singkat agar pembeli bisa datang langsung. Hanya kecamatan yang wajib —
                  alamat rinci boleh dikosongkan.
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                  <FileText className="h-4 w-4 text-faint" /> Deskripsi Usaha
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan produk/jasa yang Anda tawarkan, keunggulan, jam buka, area pengiriman, dll."
                  className="mt-1 w-full resize-none rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
                />
                <p className="mt-1 text-xs text-faint">
                  Opsional — tapi membantu calon pelanggan mengenal layanan Anda.
                </p>
              </div>

              {/* Foto usaha — maks 3 */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                  <ImageIcon className="h-4 w-4 text-faint" /> Foto Usaha{" "}
                  <span className="font-normal text-faint">(opsional, maks {MAX_PHOTOS})</span>
                </label>
                <div className="mt-1 grid grid-cols-3 gap-3">
                  {photos.map((src, idx) => (
                    <div
                      key={`${idx}-${src.slice(-16)}`}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-paper"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Foto usaha ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        aria-label={`Hapus foto ${idx + 1}`}
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white transition hover:bg-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoBusy}
                      className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-line bg-paper text-faint transition hover:border-green hover:text-green disabled:opacity-60"
                    >
                      {photoBusy ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <span className="flex flex-col items-center gap-1 text-xs">
                          <ImageIcon className="h-5 w-5" />
                          Tambah foto
                        </span>
                      )}
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  multiple
                  className="hidden"
                  onChange={addPhotos}
                />
                {photoError && <p className="mt-1.5 text-xs text-red-600">{photoError}</p>}
                <p className="mt-1 text-xs text-faint">
                  {isFnB
                    ? "JPG/PNG/WebP. Setelah foto terunggah, wajib isi keterangan menu + harga untuk tiap foto di bawah."
                    : "JPG/PNG/WebP. Foto otomatis dikompresi — pilih foto kerja terbaik Anda."}
                </p>
              </div>

              {/* Informasi harga — WAJIB; bentuk isian menyesuaikan kategori
                  (kuliner: menu+harga sesuai foto · produk: rentang · jasa: tarif) */}
              <div id="harga" className="scroll-mt-24">
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                  <Wallet className="h-4 w-4 text-faint" /> Informasi harga{" "}
                  <span className="font-normal text-red-500">*</span>
                </label>
                <p className="mb-3 text-xs text-faint">
                  Harga tampil di daftar usaha &amp; profil — calon pembeli tahu tarif sebelum
                  menghubungi.
                  {isFnB && " Khusus kuliner: tiap foto diberi keterangan menu + harganya sesuai foto."}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="priceMin" className="mb-1.5 block text-sm font-medium text-ink">
                      {isFnB
                        ? "Harga menu termurah"
                        : isProduct
                          ? "Harga termurah"
                          : "Tarif mulai dari"}{" "}
                      <span className="font-normal text-faint">(Rp)</span>
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="shrink-0 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-faint">
                        Rp
                      </span>
                      <input
                        id="priceMin"
                        type="text"
                        inputMode="numeric"
                        required
                        value={priceMin ? Number(priceMin).toLocaleString("id-ID") : ""}
                        onChange={(e) => setPriceMin(e.target.value.replace(/[^0-9]/g, "").slice(0, 9))}
                        placeholder={isFnB || isProduct ? "10.000" : "75.000"}
                        className="w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="priceMax" className="mb-1.5 block text-sm font-medium text-ink">
                      Harga tertinggi <span className="font-normal text-faint">(Rp, opsional)</span>
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="shrink-0 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-faint">
                        Rp
                      </span>
                      <input
                        id="priceMax"
                        type="text"
                        inputMode="numeric"
                        value={priceMax ? Number(priceMax).toLocaleString("id-ID") : ""}
                        onChange={(e) => setPriceMax(e.target.value.replace(/[^0-9]/g, "").slice(0, 9))}
                        placeholder={isFnB || isProduct ? "25.000" : "500.000"}
                        className="w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
                      />
                    </div>
                  </div>
                </div>

                {/* Khusus F&B — keterangan menu per foto (harga sesuai fotonya) */}
                {isFnB && photos.length > 0 && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                      <ImageIcon className="h-3.5 w-3.5" />
                      Menu pada tiap foto — wajib, harga sesuai fotonya
                    </p>
                    <div className="mt-2.5 space-y-2">
                      {photos.map((_, i) => (
                        <div key={`caption-${i}`} className="flex items-center gap-2.5">
                          <span className="shrink-0 rounded border border-amber-200 bg-surface px-1.5 py-1 font-mono text-[10px] font-semibold text-amber-700">
                            Foto {i + 1}
                          </span>
                          <input
                            type="text"
                            value={captions[i] || ""}
                            maxLength={90}
                            onChange={(e) =>
                              setCaptions((prev) =>
                                prev.map((c, j) => (j === i ? e.target.value : c))
                              )
                            }
                            placeholder={`Contoh: ${["Ayam geprek — Rp 13.000", "Getuk lapis — Rp 10.000", "Es degan — Rp 8.000"][i % 3]}`}
                            className="w-full rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daftar harga rinci (opsional) — contoh menyesuaikan kategori */}
                <div className="mt-4">
                  <label htmlFor="priceNote" className="mb-1.5 block text-sm font-medium text-ink">
                    {isFnB ? "Daftar harga menu lengkap" : "Keterangan tarif"}{" "}
                    <span className="font-normal text-faint">(opsional)</span>
                  </label>
                  <textarea
                    id="priceNote"
                    rows={3}
                    value={priceNote}
                    onChange={(e) => setPriceNote(e.target.value)}
                    placeholder={
                      isFnB
                        ? "Satu menu satu baris:\nGetuk lapis — Rp 10.000\nLanting balut — Rp 15.000\nEs degan — Rp 8.000"
                        : isProduct
                          ? "Satu produk satu baris:\nBatik tulis pria — Rp 185.000\nSelendang — Rp 75.000"
                          : "Satu layanan satu baris:\nCuci AC 1 PK — Rp 75.000/unit\nIsi freon — Rp 150.000"
                    }
                    className="mt-1 w-full resize-none rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15"
                  />
                  <p className="mt-1 text-xs text-faint">
                    Satu baris satu item — tampil sebagai daftar rapi di profil usaha Anda.
                  </p>
                </div>
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

              {/* Turnstile — verifikasi keamanan (tak tampil bila belum diaktifkan) */}
              {tsSiteKey && (
                <Turnstile siteKey={tsSiteKey} onToken={setTsToken} resetSignal={tsReset} />
              )}

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
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green px-6 py-3 text-sm font-semibold text-black transition hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-60"
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
                Dengan mendaftar, Anda menyetujui bahwa data di atas benar dan dapat diverifikasi
                oleh tim JasaKebumen, serta menyetujui{" "}
                <Link
                  href="/syarat"
                  target="_blank"
                  className="font-medium text-green underline underline-offset-2 transition hover:text-green-dark"
                >
                  Syarat &amp; Ketentuan
                </Link>{" "}
                yang berlaku.
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
            <div key={item.label} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
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
