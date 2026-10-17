import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/* Required for Cloudflare Pages (next-on-pages) */
export const runtime = "edge";

export async function GET() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ categories });
}
