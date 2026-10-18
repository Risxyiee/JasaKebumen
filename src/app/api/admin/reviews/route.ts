import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { ensureDb } from "@/lib/db-bootstrap";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

const ALLOWED_STATUS = new Set(["pending", "published", "rejected"]);

/**
 * GET /api/admin/reviews — ADMIN-ONLY.
 * Daftar semua ulasan (termasuk pending) untuk moderasi di /admin.
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const dbReady = await ensureDb();
    if (!dbReady) {
      return NextResponse.json(
        { error: "Database tidak terjangkau." },
        { status: 503 }
      );
    }

    const reviews = await db.review.findMany({
      include: {
        provider: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("[admin-reviews-list] error:", error);
    return NextResponse.json({ error: "Gagal mengambil data." }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/reviews — ADMIN-ONLY.
 * Ubah status ulasan: { id, status: "published" | "rejected" | "pending" }.
 */
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || typeof status !== "string" || !ALLOWED_STATUS.has(status)) {
      return NextResponse.json(
        { error: "Parameter tidak valid." },
        { status: 400 }
      );
    }

    const dbReady = await ensureDb();
    if (!dbReady) {
      return NextResponse.json(
        { error: "Database tidak terjangkau." },
        { status: 503 }
      );
    }

    const review = await db.review.update({
      where: { id: String(id) },
      data: { status },
      include: {
        provider: { select: { id: true, name: true, status: true } },
      },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("[admin-reviews-update] error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui ulasan." },
      { status: 500 }
    );
  }
}
