import { NextResponse } from "next/server";
import { adminCookieName, isValidAdminLogin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };

  if (!isValidAdminLogin(body.email || "", body.password || "")) {
    return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, "ok", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  return response;
}
