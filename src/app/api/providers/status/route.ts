import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* PATCH /api/providers/status — Update provider status (publish/reject) */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID dan status wajib diisi." },
        { status: 400 }
      );
    }

    if (!["published", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Status tidak valid. Gunakan: published, rejected, atau pending." },
        { status: 400 }
      );
    }

    const existing = await db.provider.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Mitra tidak ditemukan." },
        { status: 404 }
      );
    }

    const provider = await db.provider.update({
      where: { id },
      data: { status },
      include: { category: true, district: true },
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Error updating provider status:", error);
    return NextResponse.json(
      { error: "Gagal mengubah status mitra." },
      { status: 500 }
    );
  }
}
