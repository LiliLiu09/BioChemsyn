"use client";

import Link from "@/components/LocaleLink";
import { Search } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { InfoArticle } from "@/lib/types";
import { useLanguage } from "@/components/LanguageProvider";

export function InfoExplorer({ articles }: { articles: InfoArticle[] }) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const query = searchParams.get("q") || "";
  const updateFilter = (key: "q" | "category", value: string) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };
  const categories = useMemo(() => [["", ""], ...Array.from(new Map(articles.filter((article) => article.category).map((article) => [article.categoryKey || article.category, article.category])).entries())], [articles]);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return articles.filter((article) => {
      const categoryMatched = category === "" || (article.categoryKey || article.category) === category || article.category === category;
      const haystack = [article.title, article.summary, article.content, article.category, article.author, article.source].join(" ").toLowerCase();
      return categoryMatched && (!keyword || haystack.includes(keyword));
    });
  }, [articles, category, query]);

  return (
    <section className="info-layout">
      <aside className="info-filter panel">
          <h2>{t("资讯分类", "Resource categories")}</h2>
        <div className="info-category-list" aria-label={t("资讯分类", "Resource categories")}>
          {categories.map(([key, label]) => (
            <button className={key === category ? "active" : ""} aria-pressed={key === category} type="button" key={key} onClick={() => updateFilter("category", key)}>
              <span>{label || t("全部", "All")}</span>
              <b>{key === "" ? articles.length : articles.filter((article) => (article.categoryKey || article.category) === key).length}</b>
            </button>
          ))}
        </div>
      </aside>

      <div className="info-results">
        <label className="search-field info-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">{t("搜索资讯", "Search resources")}</span>
          <input value={query} onChange={(event) => updateFilter("q", event.target.value)} placeholder={t("搜索资讯关键词、标题或摘要", "Search resources by keyword, title or summary")} />
        </label>

        <div className="result-count">
          {t(`当前显示 ${filtered.length} 条资讯`, `${filtered.length} resources found`)}{category ? ` · ${categories.find(([key]) => key === category)?.[1] || t("所选分类", "Selected category")}` : ""}
        </div>

        <div className="news-list">
          {filtered.length === 0 ? (
            <div className="notice">{t("没有找到匹配的资讯。", "No matching resources found.")}</div>
          ) : (
            filtered.map((article) => (
              <article className="news-card" key={article.id}>
                <div className="news-date">
                  <b>{article.publishedAt.slice(8, 10)}</b>
                  <span>{article.publishedAt.slice(0, 7)}</span>
                </div>
                <div className="news-card-body">
                  <div className="news-meta">
                    <span>{article.category}</span>
                    <span>{t("阅读量：", "Views: ")}{article.views}</span>
                  </div>
                  <h2>
                    <Link href={`/info/${article.slug}`}>{article.title}</Link>
                  </h2>
                  <p>{article.summary}</p>
                  <Link className="locked" href={`/info/${article.slug}`}>
                    {t("查看全文", "Read more")}
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
