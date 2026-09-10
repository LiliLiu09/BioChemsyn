"use client";

import { useState } from "react";
import type { NewsArticle } from "@/lib/types";
import { RichTextEditor } from "@/components/RichTextEditor";

const emptyArticle: NewsArticle = {
  id: "",
  slug: "",
  title: "",
  category: "公司新闻",
  author: "凯森斯生物",
  source: "凯森斯生物",
  publishedAt: new Date().toISOString().slice(0, 10),
  summary: "",
  content: "",
  coverImage: "",
  views: 0,
  published: true
};

function createSlug(title: string) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `news-${Date.now()}`
  );
}

import { useAdminLanguage, contentErrorMessage } from "@/components/admin-language";
import { useLanguage } from "@/components/LanguageProvider";
import { ContentLanguageTabs, isEnglishReady, TranslationEditor, type ContentLanguage } from "@/components/TranslationEditor";
import { articleTranslationFields } from "@/components/admin-content-fields";
export function NewsEditor({ initialNews }: { initialNews: NewsArticle[] }) {
  const { locale, t } = useAdminLanguage();
  const { t: translate } = useLanguage();
  const [contentLanguage, setContentLanguage] = useState<ContentLanguage>(locale);
  const [news, setNews] = useState(initialNews);
  const [activeId, setActiveId] = useState(initialNews[0]?.id || "");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const active = news.find((item) => item.id === activeId) || news[0];
  const english = active?.translations?.en || {};
  const englishReady = isEnglishReady(english, ["title", "content"]);
  const updateEnglish = (key: string, value: string | string[] | boolean) => {
    if (!active) return;
    setNews((current) => current.map((item) => {
      if (item.id !== active.id) return item;
      const en = { ...item.translations?.en, [key]: value };
      if (!isEnglishReady(en, ["title", "content"])) en.published = false;
      return { ...item, translations: { ...item.translations, en } };
    }));
  };

  const update = (key: keyof NewsArticle, value: string | number | boolean) => {
    if (!active) return;
    setNews((current) =>
      current.map((article) => {
        if (article.id !== active.id) return article;
        const next = { ...article, [key]: value };
        if (key === "title" && !article.slug) {
          next.slug = createSlug(String(value));
        }
        return next;
      })
    );
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const addArticle = () => {
    const now = Date.now();
    const article: NewsArticle = {
      ...emptyArticle,
      id: `n-${now}`,
      slug: `news-${now}`,
      title: "新新闻"
    };
    setNews((current) => [article, ...current]);
    setActiveId(article.id);
  };

  const removeArticle = () => {
    if (!active) return;
    const next = news.filter((article) => article.id !== active.id);
    setNews(next);
    setActiveId(next[0]?.id || "");
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const invalidChinese = news.find((article) => !article.title.trim() || !article.slug.trim() || !article.summary.trim() || !article.content.trim());
    if (invalidChinese) { setActiveId(invalidChinese.id); setContentLanguage("zh"); }
    (invalidChinese ? [invalidChinese] : []).forEach((article) => {
      if (!article.title.trim()) nextErrors.title = t("标题不能为空");
      if (!article.slug.trim()) nextErrors.slug = t("链接 slug 不能为空");
      if (!article.summary.trim()) nextErrors.summary = t("摘要不能为空");
      if (!article.content.trim()) nextErrors.content = t("正文不能为空");
    });
    const invalidEnglish = news.find((article) => article.translations?.en?.published && !isEnglishReady(article.translations.en, ["title", "content"]));
    if (invalidEnglish && !invalidChinese) {
      nextErrors.english = translate("请填写英文标题和正文，或取消英文发布。", "Complete the English title and content, or unpublish the English version.");
      setActiveId(invalidEnglish.id);
      setContentLanguage("en");
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const save = async () => {
    setMessage("");
    if (!validate()) {
      setMessage(t("请先修正表单错误"));
      return;
    }

    const response = await fetch("/api/admin/news", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ news })
    });
    setMessage(response.ok ? t("新闻内容已保存") : await contentErrorMessage(response, t("保存失败，请重新登录后台或检查 Supabase 配置")));
  };

  const uploadCover = async (file: File | undefined) => {
    if (!file || !active) return;
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "news");
    const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const payload = (await response.json()) as { url?: string; message?: string };
    setUploading(false);
    if (!response.ok || !payload.url) {
      setMessage(locale === "en" ? t("图片上传失败") : payload.message || t("图片上传失败"));
      return;
    }
    update("coverImage", payload.url);
    setMessage(t("封面图片已上传，请保存全部新闻"));
  };

  if (!active) {
    return (
      <div className="panel admin-panel">
        <button className="btn primary" type="button" onClick={addArticle}>{t("新增第一篇新闻")}</button>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="panel admin-list">
        <div className="toolbar">
          <h2>{t("新闻")}</h2>
          <button className="btn primary" type="button" onClick={addArticle}>{t("新增")}</button>
        </div>
        {news.map((article) => (
          <button className={`admin-list-item ${article.id === active.id ? "active" : ""}`} key={article.id} type="button" onClick={() => setActiveId(article.id)}>
            <b>{locale === "en" ? article.translations?.en?.title || article.slug : article.title || t("未命名新闻")}</b>
            <span>
              {article.publishedAt} · {article.published ? t("已发布") : t("草稿")}
            </span>
          </button>
        ))}
      </div>

      <div className="panel admin-panel">
        <div className="toolbar">
          <h1>{t("新闻管理")}</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" type="button" onClick={removeArticle}>{t("删除")}</button>
            <button className="btn primary" type="button" onClick={save}>{t("保存全部")}</button>
          </div>
        </div>

        <ContentLanguageTabs value={contentLanguage} onChange={setContentLanguage} ready={englishReady} />
        {contentLanguage === "en" ? <TranslationEditor values={english} fields={articleTranslationFields} onChange={updateEnglish} uploadFolder="news" ready={englishReady} /> : <div className="admin-form-grid">
          <label className="admin-field full">
            <span>{t("标题 *")}</span>
            <input className="field" value={active.title} onChange={(event) => update("title", event.target.value)} />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </label>
          <label className="admin-field">
            <span>{t("链接 slug *")}</span>
            <input className="field" value={active.slug} onChange={(event) => update("slug", event.target.value)} />
            {errors.slug && <span className="field-error">{errors.slug}</span>}
          </label>
          <label className="admin-field">
            <span>{t("分类")}</span>
            <input className="field" value={active.category} onChange={(event) => update("category", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>{t("发布日期")}</span>
            <input className="field" type="date" value={active.publishedAt} onChange={(event) => update("publishedAt", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>{t("阅读量")}</span>
            <input className="field" type="number" min={0} value={active.views} onChange={(event) => update("views", Number(event.target.value))} />
          </label>
          <label className="admin-field">
            <span>{t("作者")}</span>
            <input className="field" value={active.author} onChange={(event) => update("author", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>{t("来源")}</span>
            <input className="field" value={active.source} onChange={(event) => update("source", event.target.value)} />
          </label>
          <label className="admin-field full">
            <span>{t("封面图片")}</span>
            <input className="field" value={active.coverImage} onChange={(event) => update("coverImage", event.target.value)} placeholder={t("上传后自动生成图片地址")} />
            <input className="field" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadCover(event.target.files?.[0])} />
            {uploading && <span className="result-count">{t("封面上传中...")}</span>}
            {active.coverImage && <img className="admin-preview" src={active.coverImage} alt={t("新闻封面预览")} />}
          </label>
          <label className="admin-field full">
            <span>{t("摘要 *")}</span>
            <textarea className="field" value={active.summary} onChange={(event) => update("summary", event.target.value)} />
            {errors.summary && <span className="field-error">{errors.summary}</span>}
          </label>
          <div className="admin-field full">
            <span>{t("正文 *")}</span>
            <RichTextEditor value={active.content} onChange={(value) => update("content", value)} uploadFolder="news" imageAlt={t("新闻图片")} />
            {errors.content && <span className="field-error">{errors.content}</span>}
          </div>
          <label className="admin-field full checkbox-field">
            <input type="checkbox" checked={active.published} onChange={(event) => update("published", event.target.checked)} />
            <span>{t("发布到前台新闻中心")}</span>
          </label>
        </div>
        }
        {errors.english && <div className="notice">{errors.english}</div>}
        {message && <div className="notice">{message}</div>}
      </div>
    </div>
  );
}
