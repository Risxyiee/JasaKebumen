import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* POST /api/providers — Submit a new provider (status: pending) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, categoryId, districtId, description, whatsappNumber } = body;

    if (!name || !categoryId || !districtId || !whatsappNumber) {
      return NextResponse.json(
        { error: "Nama, kategori, kecamatan, dan nomor WhatsApp wajib diisi." },
        { status: 400 }
      );
    }

    // Validate WhatsApp number format
    const cleaned = whatsappNumber.replace(/[^0-9]/g, "");
    if (cleaned.length < 10 || cleaned.length > 15) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tidak valid." },
        { status: 400 }
      );
    }

    const provider = await db.provider.create({
      data: {
        name: name.trim(),
        categoryId,
        districtId,
        description: (description || "").trim(),
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

/* GET /api/providers — List all providers (for admin) */
export async function GET(req: NextRequest) {
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
