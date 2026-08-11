import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadLocalEnv(root = process.cwd()) {
  try {
    const raw = await readFile(path.join(root, ".env.local"), "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
      const [key, ...rest] = trimmed.split("=");
      if (process.env[key]) return;
      process.env[key] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
    });
  } catch {
    // .env.local is optional; CI can pass env vars directly.
  }
}
