import type { NewsArticle } from "./types";

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/g, " ").trim();
}

function visibleText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(?:p|div|li|h[1-6])\s*>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(x[0-9a-f]+|[0-9]+);?/gi, (entity, code: string) => {
      const point = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    })
    .replace(/&nbsp;|&ensp;|&emsp;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'");
}

export function articleSearchText(article: NewsArticle): string {
  const english = article.translations?.en;
  return normalizeSearchText([
    article.id, article.slug, article.title, article.category, article.summary, article.content,
    article.author, article.source, english?.title, english?.category, english?.summary,
    english?.content, english?.author, english?.source
  ].map(visibleText).join(" "));
}

export function articleSearchTerms(query: string): string[] {
  return normalizeSearchText(query).split(" ").filter(Boolean);
}

export function matchesArticleSearch(text: string, terms: string[]): boolean {
  return terms.every((term) => text.includes(term));
}

export type ArticleDateOrder = "newest" | "oldest";

/** Use the article's publication date, never its ID, import time or edit time. */
export function compareArticlePublishedAt(left: Pick<NewsArticle, "publishedAt">, right: Pick<NewsArticle, "publishedAt">, order: ArticleDateOrder): number {
  const a = Date.parse(left.publishedAt);
  const b = Date.parse(right.publishedAt);
  if (!Number.isFinite(a)) return Number.isFinite(b) ? 1 : 0;
  if (!Number.isFinite(b)) return -1;
  return order === "newest" ? b - a : a - b;
}
