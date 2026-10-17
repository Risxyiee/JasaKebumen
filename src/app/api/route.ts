import { NextResponse } from "next/server";

/* Always render on demand — never run at build time */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}