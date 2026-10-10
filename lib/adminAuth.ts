import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { supabaseRest } from "@/lib/supabase";

export const adminCookieName = "chem-admin-session";

const sessionLifetimeSeconds = 60 * 60 * 8;

type AdminUserRow = {
  id: string;
  email: string;
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function authenticateAdmin(email: string, password: string) {
  if (!email.trim() || !password) return null;

  const users = await supabaseRest<AdminUserRow[]>("rpc/authenticate_admin", {
    method: "POST",
    body: { p_email: email.trim(), p_password: password }
  });

  return users[0] || null;
}

export async function createAdminSession(userId: string) {
  const token = randomBytes(32).toString("base64url");

  await supabaseRest("admin_sessions", {
    method: "DELETE",
    query: `?expires_at=lte.${encodeURIComponent(new Date().toISOString())}`
  });
  await supabaseRest("admin_sessions", {
    method: "POST",
    prefer: "return=representation",
    body: {
      token_hash: hashSessionToken(token),
      user_id: userId,
      expires_at: new Date(Date.now() + sessionLifetimeSeconds * 1000).toISOString()
    }
  });

  return token;
}

export async function deleteAdminSession(token: string) {
  if (!token) return;
  await supabaseRest("admin_sessions", {
    method: "DELETE",
    query: `?token_hash=eq.${hashSessionToken(token)}`
  });
}

export async function isAdminAuthed() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminCookieName)?.value || "";
  if (!token) return false;

  try {
    return await supabaseRest<boolean>("rpc/is_admin_session_valid", {
      method: "POST",
      body: { p_token_hash: hashSessionToken(token) }
    });
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  if (!(await isAdminAuthed())) {
    throw new Error("Unauthorized");
  }
}

export async function currentAdminSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(adminCookieName)?.value || "";
}

export const adminSessionMaxAge = sessionLifetimeSeconds;
