import { NextResponse, type NextRequest } from "next/server";
import { localeCookieName, localizePath } from "@/lib/i18n";

export function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("language") === "en" ? "en" : "zh";
  const requestedPath = request.nextUrl.searchParams.get("returnTo") || "/";
  const safePath = requestedPath.startsWith("/") && !requestedPath.startsWith("//") && !/[\\\r\n]/.test(requestedPath)
    ? requestedPath : "/";
  // Keep the redirect relative so reverse proxies never leak an internal
  // origin such as http://localhost:3000 into the public Location header.
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: localizePath(safePath, locale) }
  });
  response.cookies.set(localeCookieName, locale, {
    httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 60 * 60 * 24 * 365
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
