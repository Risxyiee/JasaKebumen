import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { ensureDb } from "@/lib/db-bootstrap";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/messages — ADMIN-ONLY.
 * Inbox pesan CS (terbaru dulu, maks 300) untuk tab "Pesan" di /admin.
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const dbReady = await ensureDb();
    if (!dbReady) {
      return NextResponse.json({ error: "Database tidak terjangkau." }, { status: 503 });
    }

    const messages = await db.csMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[admin-messages-list] error:", error);
    return NextResponse.json({ error: "Gagal mengambil data." }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/messages — ADMIN-ONLY.
 * Tandai pesan selesai/belum: { id, handled: boolean }.
 */
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { id, handled } = body;

    if (!id || typeof handled !== "boolean") {
      return NextResponse.json({ error: "Parameter tidak valid." }, { status: 400 });
    }

    const dbReady = await ensureDb();
    if (!dbReady) {
      return NextResponse.json({ error: "Database tidak terjangkau." }, { status: 503 });
    }

    const message = await db.csMessage.update({
      where: { id: String(id) },
      data: { handled },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[admin-messages-update] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui pesan." }, { status: 500 });
  }
}
