import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/**
 * GET /api/providers/[id]/images/[index]
 *
 * Melayani foto usaha yang tersimpan sebagai data URL di kolom Provider.images.
 *  - Mitra berstatus "published" → publik + cache immutable
 *  - Selain itu (pending/rejected) → hanya admin (foto applicant bukan barang publik)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const { id, index } = await params;
  const idx = Number.parseInt(index, 10);

  try {
    const provider = await db.provider.findUnique({
      where: { id },
      select: { images: true, status: true },
    });
    if (!provider || Number.isNaN(idx) || idx < 0 || idx >= provider.images.length) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (provider.status !== "published") {
      const denied = await requireAdmin(_req);
      if (denied) return denied;
    }

    const dataUrl = provider.images[idx];
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) return new NextResponse("Not found", { status: 404 });

    const [, mime, base64] = match;
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control":
          provider.status === "published"
            ? "public, max-age=31536000, immutable"
            : "private, no-store",
      },
    });
  } catch (error) {
    console.error("[provider-image] error:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}
