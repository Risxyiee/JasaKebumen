import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const districts = await db.district.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ districts });
}
