import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/* POST /api/providers — Submit a new provider (status: pending). PUBLIK. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, categoryId, districtId, description, whatsappNumber, website } = body;

    /* Honeypot: field tersembunyi untuk manusia. Bot yang mengisinya dianggap spam —
       balas sukses palsu tanpa menyimpan apa pun (jangan memberi sinyal ke bot). */
    if (typeof website === "string" && website.trim() !== "") {
      return NextResponse.json({ provider: null }, { status: 201 });
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

    const provider = await db.provider.create({
      data: {
        name: cleanName,
        categoryId: String(categoryId),
        districtId: String(districtId),
        description: cleanDesc,
        whatsappNumber: cleaned,
        status: "pending",
      },
      include: { category: true, district: true },
    });

    return NextResponse.json({ provider }, { status: 201 });
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
