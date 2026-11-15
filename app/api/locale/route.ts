import { NextResponse, type NextRequest } from "next/server";
import { localeCookieName, localizePath } from "@/lib/i18n";

const canonicalOrigin = "https://biochemsyn.com";

export function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("language") === "en" ? "en" : "zh";
  const requestedPath = request.nextUrl.searchParams.get("returnTo") || "/";
  const safePath = requestedPath.startsWith("/") && !requestedPath.startsWith("//") && !/[\\\r\n]/.test(requestedPath)
    ? requestedPath : "/";
  let target = new URL(localizePath("/", locale), canonicalOrigin);
  try {
    const candidate = new URL(localizePath(safePath, locale), canonicalOrigin);
    if (candidate.origin === canonicalOrigin && !candidate.pathname.startsWith("//")) {
      target = candidate;
    }
  } catch {
    // An invalid legacy URL falls back to the selected language's home page.
  }
  const isWww = request.headers.get("host")?.toLowerCase() === "www.biochemsyn.com";
  // Other hosts get a relative Location so reverse proxies never expose localhost.
  const location = isWww ? target.href : `${target.pathname}${target.search}${target.hash}`;
  const response = new NextResponse(null, {
    status: 301,
    headers: { Location: location }
  });
  response.cookies.set(localeCookieName, locale, {
    httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 60 * 60 * 24 * 365
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
