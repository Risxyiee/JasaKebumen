import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDb } from "@/lib/db-bootstrap";
import { REF_DISTRICTS } from "@/lib/reference";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

/**
 * GET /api/districts — kecamatan untuk form /daftar.
 * Selalu balas 200 JSON: kalau DB gagal/di-seed, pakai data referensi
 * (ID deterministik, sama dengan yang di-seed) supaya user tidak pernah stuck.
 */
export async function GET() {
  try {
    if (await ensureDb()) {
      const districts = await db.district.findMany({ orderBy: { name: "asc" } });
      if (districts.length > 0) {
        return NextResponse.json({ districts });
      }
    }
  } catch (error) {
    console.error("[api/districts] DB gagal, pakai fallback:", error);
  }
  return NextResponse.json({ districts: REF_DISTRICTS, fallback: true });
}
