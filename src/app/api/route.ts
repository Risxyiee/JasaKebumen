import { NextResponse } from "next/server";

/* Required for Cloudflare Pages (next-on-pages) */
export const runtime = "edge";

export async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}