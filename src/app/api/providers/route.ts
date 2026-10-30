import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { ensureDb } from "@/lib/db-bootstrap";
import { notifyNewProvider } from "@/lib/notify";
import { allowRequest, tooMany } from "@/lib/rate-limit";
import { verifyTurnstile, turnstileRejected } from "@/lib/turnstile";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/* Batas foto usaha: maks 3, tiap foto adalah data URL (JPEG/PNG/WebP)
   hasil kompresi di sisi client. 700_000 karakter ≈ 525 KB biner. */
const MAX_IMAGES = 3;
const MAX_IMAGE_CHARS = 700_000;
const IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

/* Batas harga rupiah (PRD: keterangan harga wajib): 1 – 100 juta */
const MAX_PRICE = 100_000_000;

function sanitizePrice(input: unknown): number | null {
  const raw = typeof input === "string" ? input.replace(/[^0-9]/g, "") : input;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(Math.round(n), MAX_PRICE);
}

/* Keterangan per foto — indeks sejajar foto; dibersihkan & dibatasi 90 karakter */
function sanitizeCaptions(input: unknown, count: number): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, count)
    .map((c) => String(c ?? "").trim().replace(/\s+/g, " ").slice(0, 90));
}

/* Daftar harga/tarif rinci — satu baris satu item, maks 30 baris × 1000 karakter */
function sanitizePriceNote(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean)
    .slice(0, 30)
    .join("\n")
    .slice(0, 1000);
}

function sanitizeImages(input: unknown): { images: string[]; error?: string } {
  if (input == null) return { images: [] };
  if (!Array.isArray(input)) return { images: [], error: "Format foto tidak valid." };
  if (input.length > MAX_IMAGES)
    return { images: [], error: `Maksimal ${MAX_IMAGES} foto usaha.` };

  const images: string[] = [];
  for (const raw of input) {
    const s = typeof raw === "string" ? raw : "";
    if (!IMAGE_RE.test(s))
      return { images: [], error: "Foto harus berupa gambar JPEG/PNG/WebP yang valid." };
    if (s.length > MAX_IMAGE_CHARS)
      return { images: [], error: "Ukuran foto terlalu besar. Coba foto yang lebih kecil." };
    images.push(s);
  }
  return { images };
}

/* POST /api/providers — Submit a new provider (status: pending). PUBLIK. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, categoryId, districtId, description, address, whatsappNumber, website } = body;

    /* Honeypot: field tersembunyi untuk manusia. Bot yang mengisinya dianggap spam —
       balas sukses palsu tanpa menyimpan apa pun (jangan memberi sinyal ke bot).
       Harus dicek SEBELUM apa pun akses DB, agar respons bot selalu identik. */
    if (typeof website === "string" && website.trim() !== "") {
      return NextResponse.json({ provider: null }, { status: 201 });
    }

    /* Rate limit per-IP (burst 15/10 dtk) — lapisan 1 anti-spam */
    if (!(await allowRequest(req, "daftar"))) {
      return NextResponse.json(tooMany(), { status: 429 });
    }

    /* Turnstile (PRD: reCAPTCHA) — lapisan 2; tidak aktif bila SECRET belum diset */
    const ts = await verifyTurnstile(body.turnstileToken, req.headers.get("cf-connecting-ip") || "");
    if (!ts.ok) {
      return NextResponse.json(turnstileRejected(), { status: 403 });
    }

    /* Pastikan tabel & data referensi (kategori/kecamatan) siap —
       database produksi yang masih kosong otomatis ter-seed di sini. */
    const dbReady = await ensureDb();
    if (!dbReady) {
      return NextResponse.json(
        { error: "Server sedang tidak bisa mengakses database. Coba beberapa saat lagi." },
        { status: 503 }
      );
    }

    if (!name || !categoryId || !districtId || !whatsappNumber) {
      return NextResponse.json(
        { error: "Nama, kategori, kecamatan, dan nomor WhatsApp wajib diisi." },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim().slice(0, 80);
    const cleanDesc = String(description || "").trim().slice(0, 1000);
    /* Alamat toko/workshop singkat (opsional) — PRD: profil UMKM memuat alamat fisik */
    const cleanAddress = String(address || "").trim().slice(0, 160);

    // Validate WhatsApp number format
    const cleaned = String(whatsappNumber).replace(/[^0-9]/g, "");
    if (cleaned.length < 10 || cleaned.length > 15) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tidak valid." },
        { status: 400 }
      );
    }

    // Validate photos (opsional, maks 3)
    const { images, error: imgError } = sanitizeImages(body.images);
    if (imgError) {
      return NextResponse.json({ error: imgError }, { status: 400 });
    }

    /* Kategori & kecamatan harus ada di DB (sudah dijamin ter-seed oleh
       ensureDb). ID fallback dari form pun cocok karena deterministik. */
    const category = await db.category.findUnique({ where: { id: String(categoryId) } });
    const district = await db.district.findUnique({ where: { id: String(districtId) } });
    if (!category || !district) {
      return NextResponse.json(
        { error: "Kategori atau kecamatan tidak dikenal. Muat ulang halaman lalu pilih ulang." },
        { status: 400 }
      );
    }

    /* ----- Keterangan harga (wajib; tampilan menyesuaikan kategori) ----- */
    const priceMin = sanitizePrice(body.priceMin);
    if (!priceMin) {
      return NextResponse.json(
        { error: "Harga mulai dari wajib diisi — angka dalam rupiah, tanpa titik." },
        { status: 400 }
      );
    }
    const priceMax = sanitizePrice(body.priceMax);
    if (priceMax && priceMax <= priceMin) {
      return NextResponse.json(
        { error: "Harga tertinggi harus lebih besar dari harga termurah." },
        { status: 400 }
      );
    }
    const priceNote = sanitizePriceNote(body.priceNote);
    const imageCaptions = sanitizeCaptions(body.imageCaptions, images.length);

    /* F&B (kuliner): harga harus sesuai foto — tiap foto wajib diberi
       keterangan menu + harganya agar pembeli tidak perlu bertanya. */
    if (category.slug === "kuliner" && images.length > 0 && imageCaptions.some((c) => !c)) {
      return NextResponse.json(
        { error: "Kategori kuliner: setiap foto wajib diberi keterangan menu beserta harganya." },
        { status: 400 }
      );
    }

    const provider = await db.provider.create({
      data: {
        name: cleanName,
        categoryId: category.id,
        districtId: district.id,
        description: cleanDesc,
        address: cleanAddress,
        whatsappNumber: cleaned,
        images,
        priceMin,
        priceMax,
        priceNote,
        imageCaptions,
        status: "pending",
      },
      include: { category: true, district: true },
    });

    /* Notifikasi owner via Telegram — kegagalan tidak menggagalkan pendaftaran */
    notifyNewProvider({
      name: provider.name,
      categoryName: provider.category.name,
      districtName: provider.district.name,
      whatsappNumber: provider.whatsappNumber,
      photoCount: images.length,
      address: provider.address,
    }).catch(() => {});

    return NextResponse.json({ provider: { id: provider.id } }, { status: 201 });
  } catch (error) {
    console.error("Error creating provider:", error);
    return NextResponse.json(
      { error: "Gagal mendaftarkan mitra. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

/* GET /api/providers — List providers. ADMIN-ONLY:
   data pendaftar (termasuk yang pending + nomor WA) tidak boleh bocor ke publik. */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    const where = status ? { status } : {};

    const providers = await db.provider.findMany({
      where,
      include: { category: true, district: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data." },
      { status: 500 }
    );
  }
}
