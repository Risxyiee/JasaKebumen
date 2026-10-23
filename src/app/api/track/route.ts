import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDb } from "@/lib/db-bootstrap";
import { allowRequest } from "@/lib/rate-limit";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

const SOURCES = new Set(["direktori", "profil"]);

/**
 * POST /api/track — catat klik tombol WhatsApp. PUBLIK.
 *
 * KPI PRD: "Jumlah klik tombol Hubungi via WhatsApp". Satu klik = 1 baris
 * WaClick + counter Provider.waClicks naik (atomic increment).
 * Ringan, tanpa PII: hanya id usaha dan asal klik.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const providerId =
      typeof body?.providerId === "string" ? body.providerId.slice(0, 40) : "";
    const source =
      typeof body?.source === "string" && SOURCES.has(body.source)
        ? body.source
        : "profil";

    if (!providerId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    /* Rate limit per-IP — melindungi KPI klik WA dari inflasi bot.
       Tracking bersifat best-effort: 429 hanya membuat klik itu tidak
dihitung, navigasi ke WhatsApp tetap berjalan normal. */
    if (!(await allowRequest(req, "klik-wa"))) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const ready = await ensureDb();
    if (!ready) return NextResponse.json({ ok: false }, { status: 503 });

    /* Hanya usaha yang sudah tayang yang dihitung — pending/rejected tidak */
    const provider = await db.provider.findFirst({
      where: { id: providerId, status: "published" },
      select: { id: true },
    });
    if (!provider) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    await db.$transaction([
      db.provider.update({
        where: { id: providerId },
        data: { waClicks: { increment: 1 } },
      }),
      db.waClick.create({ data: { providerId, source } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[track] gagal mencatat klik WA:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
