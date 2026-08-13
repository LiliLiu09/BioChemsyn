import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getInfoArticles, saveInfoArticles } from "@/lib/cms";
import type { InfoArticle } from "@/lib/types";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeArticle(article: InfoArticle): InfoArticle {
  const id = article.id || `i-${Date.now()}`;
  const title = article.title?.trim() || "未命名咨询";
  return {
    ...article,
    id,
    title,
    slug: article.slug?.trim() || slugify(title) || id,
    category: article.category?.trim() || "服务咨询",
    author: article.author?.trim() || "凯森斯生物",
    source: article.source?.trim() || "凯森斯生物",
    publishedAt: article.publishedAt || new Date().toISOString().slice(0, 10),
    summary: article.summary || "",
    content: article.content || "",
    coverImage: article.coverImage || "",
    views: Number(article.views || 0),
    published: Boolean(article.published)
  };
}

export async function GET() {
  await requireAdmin();
  const info = await getInfoArticles();
  return NextResponse.json({ info });
}

export async function PUT(request: Request) {
  await requireAdmin();
  const body = (await request.json()) as { info?: InfoArticle[] };
  const info = (body.info || []).map(normalizeArticle);
  await saveInfoArticles(info);
  return NextResponse.json({ ok: true, info });
}
