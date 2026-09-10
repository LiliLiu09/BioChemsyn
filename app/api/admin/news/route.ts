import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getNewsArticles, saveNewsArticles } from "@/lib/cms";
import type { NewsArticle } from "@/lib/types";
import { isEnglishContent } from "@/lib/content-locale";
import { translate } from "@/lib/i18n";
import { contentSaveError, requestLocale } from "../content-errors";

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
  if (news.some((article) => article.translations?.en?.published === true && (!isEnglishContent(article.translations.en.title) || !isEnglishContent(article.translations.en.content)))) {
    return NextResponse.json({ code: "ENGLISH_TRANSLATION_INCOMPLETE", error: translate(requestLocale(request), "发布英文新闻前，请填写英文标题和正文。", "Enter an English title and body before publishing the English news article.") }, { status: 400 });
  }
  try { await saveNewsArticles(news); } catch (error) { return contentSaveError(error, request); }
  return NextResponse.json({ ok: true, news });
}
