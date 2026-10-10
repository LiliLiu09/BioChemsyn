import { NextResponse } from "next/server";
import { adminCookieName, adminSessionMaxAge, authenticateAdmin, createAdminSession } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };

  try {
    const user = await authenticateAdmin(body.email || "", body.password || "");
    if (!user) {
      return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
    }

    const token = await createAdminSession(user.id);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: adminSessionMaxAge
    });

    return response;
  } catch {
    return NextResponse.json({ message: "登录服务暂时不可用，请检查数据库配置" }, { status: 503 });
  }
}
