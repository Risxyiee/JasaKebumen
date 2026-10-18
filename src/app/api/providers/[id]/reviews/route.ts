import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDb } from "@/lib/db-bootstrap";
import { notifyNewReview } from "@/lib/notify";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/**
 * POST /api/providers/[id]/reviews — PUBLIK.
 *
 * Kirim ulasan untuk usaha yang sudah tayang. Ulasan masuk dengan status
 * "pending" dan baru tampil setelah admin meng-approve (moderasi manual,
 * sama seperti pendaftaran mitra).
 *
 * Anti-spam: honeypot field `website` (manusia tidak pernah mengisinya).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, rating, comment, website } = body;

    /* Honeypot: bot mengisi field tersembunyi → balas sukses palsu tanpa DB */
    if (typeof website === "string" && website.trim() !== "") {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const dbReady = await ensureDb();
    if (!dbReady) {
      return NextResponse.json(
        { error: "Server sedang tidak bisa mengakses database. Coba beberapa saat lagi." },
        { status: 503 }
      );
    }

    const cleanName = String(name || "").trim().slice(0, 60);
    const cleanComment = String(comment || "").trim().slice(0, 600);
    const numRating = Number(rating);

    if (cleanName.length < 2) {
      return NextResponse.json({ error: "Nama minimal 2 karakter." }, { status: 400 });
    }
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: "Pilih rating bintang 1–5." }, { status: 400 });
    }
    if (cleanComment.length < 4) {
      return NextResponse.json({ error: "Tulis ulasan minimal 4 karakter." }, { status: 400 });
    }

    /* Hanya usaha yang sudah tayang yang bisa diulas */
    const provider = await db.provider.findUnique({
      where: { id },
      select: { id: true, name: true, status: true },
    });
    if (!provider || provider.status !== "published") {
      return NextResponse.json(
        { error: "Profil usaha tidak tersedia." },
        { status: 404 }
      );
    }

    const review = await db.review.create({
      data: {
        providerId: provider.id,
        name: cleanName,
        rating: numRating,
        comment: cleanComment,
        status: "pending",
      },
    });

    /* Notifikasi owner via Telegram — kegagalan tidak menggagalkan ulasan */
    notifyNewReview({
      providerName: provider.name,
      reviewerName: cleanName,
      rating: numRating,
      comment: cleanComment,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: review.id }, { status: 201 });
  } catch (error) {
    console.error("[review-create] error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim ulasan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
