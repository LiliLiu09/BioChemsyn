import { NextResponse } from "next/server";
import { adminCookieName, currentAdminSessionToken, deleteAdminSession } from "@/lib/adminAuth";

export async function POST() {
  const token = await currentAdminSessionToken();
  try {
    await deleteAdminSession(token);
  } catch {
    // Clear the browser cookie even if the database is temporarily unavailable.
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}
