import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/reset",
  "/candidate",
  "/candidate/thanks",
  "/interview",
];
const PUBLIC_API = ["/api/auth", "/api/submit", "/api/chat"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("oo_session")?.value);

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isPublicApi = PUBLIC_API.some((path) => pathname.startsWith(path));
  const isPublicLinkToken =
    pathname.startsWith("/api/links/") && pathname !== "/api/links";

  if (!isPublicPath && !isPublicApi && !isPublicLinkToken && !hasSession) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|public).*)"],
};
