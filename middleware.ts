import { NextResponse, type NextRequest } from "next/server";
import { localeCookieName, stripLocale } from "./lib/i18n";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const english = path === "/en" || path.startsWith("/en/");
  const barePath = stripLocale(path);

  // Remember the preferred landing page; explicit content URLs determine their language.
  if (path === "/" && request.cookies.get(localeCookieName)?.value === "en") {
    const url = request.nextUrl.clone();
    url.pathname = "/en";
    return NextResponse.redirect(url);
  }

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
