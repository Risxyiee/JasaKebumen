import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDb } from "@/lib/db-bootstrap";
import { notifyNewCsMessage } from "@/lib/notify";
import { allowRequest, tooMany } from "@/lib/rate-limit";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/**
 * POST /api/cs — PUBLIK. Simpan pesan dari widget CS chat.
 *
 * Dua kasus pemakaian:
 *  1. Pengunjung menitipkan pesan untuk admin (ada name + contact)
 *  2. Pertanyaan yang tidak bisa dijawab bot → disimpan diam-diam
 *     supaya owner tahu apa yang dicari pengunjung (name/contact kosong)
 *
 * Setiap pesan memicu notifikasi Telegram ke owner (jika TELEGRAM_*
 * sudah diset); kegagalan notif tidak pernah menggagalkan request.
 */
export async function POST(req: NextRequest) {
  try {
    /* Rate limit per-IP — widget chat publik, rawan di-spam bot */
    if (!(await allowRequest(req, "chat"))) {
      return NextResponse.json(tooMany(), { status: 429 });
    }

    const body = await req.json();
    const rawSession = String(body.sessionId || "");
    const sessionId = rawSession.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
    const name = String(body.name || "").trim().slice(0, 60);
    const contact = String(body.contact || "").replace(/[^0-9+]/g, "").slice(0, 16);
    const text = String(body.text || "").trim().slice(0, 1000);

    if (!sessionId || sessionId.length < 6) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }

    const dbReady = await ensureDb();
    if (!dbReady) {
      return NextResponse.json(
        { error: "Server sedang sibuk. Coba beberapa saat lagi." },
        { status: 503 }
      );
    }

    await db.csMessage.create({
      data: { sessionId, name, contact, text },
    });

    /* Notifikasi owner — fire, tapi jangan block gagal */
    notifyNewCsMessage({ name, contact, text }).catch(() => {});

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[cs-message] error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim pesan. Coba lagi." },
      { status: 500 }
    );
  }
}
