import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getInfoArticles, saveInfoArticles } from "@/lib/cms";
import type { InfoArticle } from "@/lib/types";
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

function normalizeArticle(article: InfoArticle): InfoArticle {
  const id = article.id || `i-${Date.now()}`;
  const title = article.title?.trim() || "未命名资讯";
  return {
    ...article,
    id,
    title,
    slug: article.slug?.trim() || slugify(title) || id,
    category: article.category?.trim() || "服务资讯",
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
  if (info.some((article) => article.translations?.en?.published === true && (!isEnglishContent(article.translations.en.title) || !isEnglishContent(article.translations.en.content)))) {
    return NextResponse.json({ code: "ENGLISH_TRANSLATION_INCOMPLETE", error: translate(requestLocale(request), "发布英文资讯前，请填写英文标题和正文。", "Enter an English title and body before publishing the English article.") }, { status: 400 });
  }
  try { await saveInfoArticles(info); } catch (error) { return contentSaveError(error, request); }
  return NextResponse.json({ ok: true, info });
}
