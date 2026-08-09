import { cookies } from "next/headers";

export const adminCookieName = "chem-admin-session";

function adminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123456";
}

function adminEmail() {
  return process.env.ADMIN_EMAIL || "admin@example.com";
}

export function isValidAdminLogin(email: string, password: string) {
  return email === adminEmail() && password === adminPassword();
}

export async function isAdminAuthed() {
  const cookieStore = await cookies();
  return cookieStore.get(adminCookieName)?.value === "ok";
}

export async function requireAdmin() {
  if (!(await isAdminAuthed())) {
    throw new Error("Unauthorized");
  }
}
