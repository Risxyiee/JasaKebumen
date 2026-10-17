import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ categories });
}
