import { NextRequest, NextResponse } from "next/server";
import { recordPageView } from "@/lib/analytics";
import { stripLocale } from "@/lib/i18n";

const recentViewCookie = "kasons-recent-page-view";
const publicPagePattern = /^\/(?:$|products(?:\/[^/]{1,160})?|news(?:\/[^/]{1,160})?|info(?:\/[^/]{1,160})?|about|contact|cart|search)$/;

function normalizePublicPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.length > 500) return "";
  const path = stripLocale(value.split(/[?#]/, 1)[0]).replace(/\/{2,}/g, "/");
  if (!publicPagePattern.test(path)) return "";
  return path;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { path?: unknown };
  const path = normalizePublicPath(body.path);
  if (!path) return NextResponse.json({ ok: false }, { status: 400 });

  const cookieValue = encodeURIComponent(path);
  if (request.cookies.get(recentViewCookie)?.value === cookieValue) {
    return NextResponse.json({ ok: true, counted: false });
  }

  const counted = await recordPageView(path);
  const response = NextResponse.json({ ok: true, counted });
  response.headers.set("Cache-Control", "private, no-store");
  response.cookies.set(recentViewCookie, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 20,
    path: "/"
  });
  return response;
}
