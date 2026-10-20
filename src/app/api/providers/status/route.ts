import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/* PATCH /api/providers/status — Update status (publish/reject) ATAU badge
   verified (toggle Terverifikasi). ADMIN-ONLY.
   Body: { id, status } dan/atau { id, verified }. */
export async function PATCH(req: NextRequest) {
  /* Defense in depth: middleware juga melindungi path ini, tapi route
     tetap memverifikasi sendiri — jangan pernah percaya satu lapisan saja. */
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    const hasStatus = typeof body?.status === "string";
    const hasVerified = typeof body?.verified === "boolean";

    if (!id || (!hasStatus && !hasVerified)) {
      return NextResponse.json(
        { error: "ID wajib diisi, disertai status atau verified." },
        { status: 400 }
      );
    }

    if (hasStatus && !["published", "rejected", "pending"].includes(body.status)) {
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

    const data: { status?: string; verified?: boolean } = {};
    if (hasStatus) data.status = body.status;
    if (hasVerified) data.verified = body.verified;

    const provider = await db.provider.update({
      where: { id },
      data,
      include: { category: true, district: true },
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Error updating provider status:", error);
    return NextResponse.json(
      { error: "Gagal mengubah data mitra." },
      { status: 500 }
    );
  }
}
