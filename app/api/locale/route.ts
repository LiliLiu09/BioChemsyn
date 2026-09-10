import { NextResponse, type NextRequest } from "next/server";
import { localeCookieName, localizePath } from "@/lib/i18n";

export function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("language") === "en" ? "en" : "zh";
  const requestedPath = request.nextUrl.searchParams.get("returnTo") || "/";
  const safePath = requestedPath.startsWith("/") && !requestedPath.startsWith("//") && !/[\\\r\n]/.test(requestedPath)
    ? requestedPath : "/";
  const destination = new URL(localizePath(safePath, locale), request.url);
  // Never allow a language switch to be used as an external redirect.
  if (destination.origin !== request.nextUrl.origin) destination.href = new URL("/", request.url).href;
  const response = NextResponse.redirect(destination, 303);
  response.cookies.set(localeCookieName, locale, {
    httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 60 * 60 * 24 * 365
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
