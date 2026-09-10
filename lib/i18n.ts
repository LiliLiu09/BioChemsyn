export type Locale = "zh" | "en";

export const localeCookieName = "kasons-language";

export function translate(locale: Locale, chinese: string, english: string) {
  return locale === "en" ? english : chinese;
}

export function stripLocale(path: string) {
  return path.replace(/^\/en(?=\/|\?|#|$)/, "") || "/";
}

/** Keep external URLs, anchors, files and API endpoints outside language routing. */
export function localizePath(path: string, locale: Locale) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const bare = stripLocale(path);
  if (/^\/(?:api|_next)(?:\/|\?|$)/.test(bare) || /\.(?:png|jpe?g|webp|gif|svg|pdf|ico|csv|xlsx?)(?:[?#]|$)/i.test(bare)) return bare;
  const normalized = bare.startsWith("/") ? bare : `/${bare}`;
  return locale === "en" ? `/en${normalized === "/" ? "" : normalized}` : normalized;
}
