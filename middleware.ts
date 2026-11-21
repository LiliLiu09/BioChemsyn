import { NextResponse, type NextRequest } from "next/server";
import { stripLocale } from "./lib/i18n";
import { legacyDestination } from "./lib/legacy-links";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const destination = legacyDestination(path, search);
  const isWww = request.headers.get("host")?.toLowerCase() === "www.biochemsyn.com";
  if (destination || isWww) {
    const canonical = new URL("https://biochemsyn.com");
    canonical.pathname = destination ?? path;
    canonical.search = search;
    return NextResponse.redirect(canonical, 301);
  }

  const english = path === "/en" || path.startsWith("/en/");
  const barePath = stripLocale(path);

  if (english && /^\/(?:api|_next)(?:\/|$)/.test(barePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-site-locale", english ? "en" : "zh");
  requestHeaders.set("x-site-path", barePath);

  if (english) {
    const url = request.nextUrl.clone();
    url.pathname = barePath;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico|pdf|woff2?|ttf|css|js|map)$).*)"]
};
