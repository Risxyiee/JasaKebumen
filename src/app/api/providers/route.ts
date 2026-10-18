import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { ensureDb } from "@/lib/db-bootstrap";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/* Batas foto usaha: maks 3, tiap foto adalah data URL (JPEG/PNG/WebP)
   hasil kompresi di sisi client. 700_000 karakter ≈ 525 KB biner. */
const MAX_IMAGES = 3;
const MAX_IMAGE_CHARS = 700_000;
const IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

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
    const { name, categoryId, districtId, description, whatsappNumber, website } = body;

    /* Honeypot: field tersembunyi untuk manusia. Bot yang mengisinya dianggap spam —
       balas sukses palsu tanpa menyimpan apa pun (jangan memberi sinyal ke bot).
       Harus dicek SEBELUM apa pun akses DB, agar respons bot selalu identik. */
    if (typeof website === "string" && website.trim() !== "") {
      return NextResponse.json({ provider: null }, { status: 201 });
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

    const provider = await db.provider.create({
      data: {
        name: cleanName,
        categoryId: category.id,
        districtId: district.id,
        description: cleanDesc,
        whatsappNumber: cleaned,
        images,
        status: "pending",
      },
      include: { category: true, district: true },
    });

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
