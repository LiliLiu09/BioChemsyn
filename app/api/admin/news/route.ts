import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getNewsArticles, saveNewsArticles } from "@/lib/cms";
import type { NewsArticle } from "@/lib/types";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeArticle(article: NewsArticle): NewsArticle {
  const id = article.id || `n-${Date.now()}`;
  const title = article.title?.trim() || "未命名新闻";
  return {
    ...article,
    id,
    title,
    slug: article.slug?.trim() || slugify(title) || id,
    category: article.category?.trim() || "公司新闻",
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
  const news = await getNewsArticles();
  return NextResponse.json({ news });
}

export async function PUT(request: Request) {
  await requireAdmin();
  const body = (await request.json()) as { news?: NewsArticle[] };
  const news = (body.news || []).map(normalizeArticle);
  await saveNewsArticles(news);
  return NextResponse.json({ ok: true, news });
}
