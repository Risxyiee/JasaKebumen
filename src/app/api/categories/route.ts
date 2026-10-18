import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDb } from "@/lib/db-bootstrap";
import { REF_CATEGORIES } from "@/lib/reference";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/**
 * GET /api/categories — kategori untuk form /daftar.
 * Selalu balas 200 JSON: kalau DB gagal/di-seed, pakai data referensi
 * (ID deterministik, sama dengan yang di-seed) supaya user tidak pernah stuck.
 */
export async function GET() {
  try {
    if (await ensureDb()) {
      const categories = await db.category.findMany({ orderBy: { name: "asc" } });
      if (categories.length > 0) {
        return NextResponse.json({ categories });
      }
    }
  } catch (error) {
    console.error("[api/categories] DB gagal, pakai fallback:", error);
  }
  return NextResponse.json({ categories: REF_CATEGORIES, fallback: true });
}
