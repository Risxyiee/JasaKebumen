import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  /* Only protect /admin and its sub-paths */
  if (!req.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  /* If env vars are not set, block all access */
  if (!username || !password) {
    return new NextResponse("Admin not configured.", { status: 503 });
  }

  /* Parse the Authorization header */
  const authHeader = req.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");

    if (scheme === "Basic") {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const [inputUser, inputPass] = decoded.split(":");

      if (inputUser === username && inputPass === password) {
        return NextResponse.next();
      }
    }
  }

  /* Reject — ask browser to show Basic Auth prompt */
  return new NextResponse(null, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="JasaKebumen Admin", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
