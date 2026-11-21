"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { articleSearchText, articleSearchTerms, compareArticlePublishedAt, matchesArticleSearch, type ArticleDateOrder } from "@/lib/admin-article-search";
import type { NewsArticle } from "@/lib/types";

export function AdminArticleList({ articles, activeId, heading, untitledLabel, onSelect, onAdd, showCategory = false }: {
  articles: NewsArticle[];
  activeId: string;
  heading: string;
  untitledLabel: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  showCategory?: boolean;
}) {
  const { locale, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [dateOrder, setDateOrder] = useState<ArticleDateOrder>("newest");
  // Index rich-text bodies only when articles change, not on every keystroke.
  const indexed = useMemo(() => articles.map((article) => ({ article, text: articleSearchText(article) })), [articles]);
  const ordered = useMemo(() => [...indexed].sort((left, right) => compareArticlePublishedAt(left.article, right.article, dateOrder)), [indexed, dateOrder]);
  const visible = useMemo(() => {
    const terms = articleSearchTerms(query);
    return ordered.filter(({ text }) => matchesArticleSearch(text, terms));
  }, [ordered, query]);

  return (
    <div className="panel admin-list">
      <div className="toolbar">
        <h2>{heading}</h2>
        <button className="btn primary" type="button" onClick={() => { setQuery(""); onAdd(); }}>{t("新增", "Add")}</button>
      </div>
      <label className="admin-article-search">
        <span>{t("搜索文章关键词", "Search articles")}</span>
        <input className="field" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder={t("输入标题、正文关键词或文章 ID", "Title, content keywords or article ID")} />
      </label>
      <label className="admin-article-search">
        <span>{t("按实际发布日期排序", "Sort by publication date")}</span>
        <select className="field" value={dateOrder} onChange={(event) => setDateOrder(event.target.value as ArticleDateOrder)}>
          <option value="newest">{t("最新发布在前", "Newest first")}</option>
          <option value="oldest">{t("最早发布在前", "Oldest first")}</option>
        </select>
      </label>
      <div className="admin-article-search-summary">
        <span role="status" aria-live="polite">{t(`找到 ${visible.length} / ${articles.length} 篇文章`, `${visible.length} of ${articles.length} articles`)}</span>
        {query && <button className="btn" type="button" onClick={() => setQuery("")}>{t("清除", "Clear")}</button>}
      </div>
      {visible.length === 0 && <p className="result-count">{t("没有匹配的文章，请更换关键词。", "No matching articles. Try another keyword.")}</p>}
      {visible.map(({ article }) => (
        <button className={`admin-list-item ${article.id === activeId ? "active" : ""}`} key={article.id} type="button"
          aria-current={article.id === activeId ? "true" : undefined} onClick={() => onSelect(article.id)}>
          <span className="admin-article-id">ID: {article.id}</span>
          <b>{locale === "en" ? article.translations?.en?.title || article.slug : article.title || untitledLabel}</b>
          <span>
            {showCategory && <>{locale === "en" ? article.translations?.en?.category || heading : article.category} · </>}
            <time dateTime={article.publishedAt || undefined}>{article.publishedAt}</time> · {article.published ? t("已发布", "Published") : t("草稿", "Draft")}
          </span>
        </button>
      ))}
    </div>
  );
}
