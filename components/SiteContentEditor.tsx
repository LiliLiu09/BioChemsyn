"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ContentLanguageTabs, isEnglishReady, TranslationEditor, type ContentLanguage, type TranslationField } from "@/components/TranslationEditor";
import type { SiteContent } from "@/lib/types";
import { contentErrorMessage } from "./admin-language";

type Field = TranslationField & { key: Exclude<keyof SiteContent, "translations" | "contentLocale"> };
const sectionFields: Record<"site" | "about" | "contact", Field[]> = {
  site: [
    { key: "brandName", zh: "品牌名称", en: "Brand name", required: true },
    { key: "tagline", zh: "品牌标语", en: "Tagline" },
    { key: "heroTitle", zh: "首页主标题", en: "Homepage title", required: true },
    { key: "heroDescription", zh: "首页描述", en: "Homepage description", multiline: true },
    { key: "primaryCta", zh: "主按钮文案", en: "Primary button text" },
    { key: "notice", zh: "用途声明", en: "Research use notice", multiline: true },
    { key: "companyName", zh: "公司名称", en: "Company name" },
    { key: "supportPhone", zh: "服务电话", en: "Support phone" },
    { key: "contactEmail", zh: "联系邮箱", en: "Contact email" },
    { key: "address", zh: "公司地址", en: "Company address" }
  ],
  about: [
    { key: "aboutTitle", zh: "关于我们标题", en: "About page title", required: true },
    { key: "aboutDescription", zh: "关于我们内容", en: "About page content", rich: true, required: true }
  ],
  contact: [
    { key: "contactTitle", zh: "联系我们标题", en: "Contact page title", required: true },
    { key: "contactDescription", zh: "联系我们内容", en: "Contact page content", rich: true, required: true },
    { key: "contactCta", zh: "联系按钮文案", en: "Contact button text" }
  ]
};

export function SiteContentEditor({ initialSite, section }: { initialSite: SiteContent; section: keyof typeof sectionFields }) {
  const { locale, t } = useLanguage();
  const [site, setSite] = useState(initialSite);
  const [language, setLanguage] = useState<ContentLanguage>(locale);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const fields = sectionFields[section];
  const english = site.translations?.en || {};
  const publishKey = `${section}Published` as "sitePublished" | "aboutPublished" | "contactPublished";
  const englishPublished = english[publishKey] ?? english.published ?? false;
  const ready = isEnglishReady(english, fields.filter((field) => field.required).map((field) => field.key));
  const title = section === "site" ? t("首页管理", "Homepage") : section === "about" ? t("关于我们管理", "About us") : t("联系我们管理", "Contact us");

  const updateEnglish = (key: string, value: string | string[] | boolean) => {
    if (typeof value !== "string" && typeof value !== "boolean") return;
    setSite((current) => ({ ...current, translations: { ...current.translations, en: { ...current.translations?.en, [key]: value } } }));
  };

  const save = async () => {
    if (fields.some((field) => field.required && !String(site[field.key]).replace(/<[^>]*>/g, "").trim())) {
      setMessage(t("请先填写中文必填内容。", "Complete the required Chinese content first."));
      setLanguage("zh");
      return;
    }
    if (section === "site" && !site.contactEmail.includes("@")) {
      setMessage(t("请填写有效邮箱。", "Enter a valid email address."));
      return;
    }
    if (section === "site" && english.contactEmail && !english.contactEmail.includes("@")) {
      setMessage(t("请填写有效的英文联系邮箱。", "Enter a valid English contact email address."));
      setLanguage("en");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const patch = {
        ...Object.fromEntries(fields.map((field) => [field.key, site[field.key]])),
        translations: { en: { ...Object.fromEntries(fields.map((field) => [field.key, english[field.key]])), [publishKey]: englishPublished && ready } }
      };
      const response = await fetch(`/api/admin/${section}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      if (response.ok) setSite((current) => ({ ...current, translations: { en: { ...current.translations?.en, [publishKey]: englishPublished && ready } } }));
      setMessage(response.ok ? t("中英文内容已保存。", "Chinese and English content saved.") : await contentErrorMessage(response, t("保存失败，请重新登录或检查存储配置。", "Save failed. Sign in again or check the storage configuration.")));
    } catch {
      setMessage(t("网络连接失败，请重试。", "Connection failed. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return <div className="panel admin-panel">
    <div className="toolbar"><div><h1>{title}</h1><p className="result-count">{t("分别维护中英文内容；电话、邮箱等相同内容也可单独设置。", "Maintain Chinese and English content separately. Contact details can be shared or customized.")}</p></div><button className="btn primary" type="button" disabled={saving} onClick={save}>{saving ? t("保存中…", "Saving…") : t("保存", "Save")}</button></div>
    <ContentLanguageTabs value={language} onChange={setLanguage} ready={ready} />
    {language === "en" ? <>
      <TranslationEditor values={english} fields={fields} onChange={updateEnglish} uploadFolder={section} ready={ready} publishable={false} />
      <label className="admin-field checkbox-field"><input type="checkbox" disabled={!ready} checked={englishPublished && ready} onChange={(event) => updateEnglish(publishKey, event.target.checked)} /><span>{t("发布此页面的英文版本", "Publish the English version of this page")}</span></label>
    </> : <div className="admin-form-grid" lang="zh-CN">
      {fields.map((field) => <div className={`admin-field ${field.rich || field.multiline ? "full" : ""}`} key={field.key}>
        {field.rich ? <><span>{t(field.zh, field.en)}{field.required ? " *" : ""}</span><RichTextEditor value={String(site[field.key])} onChange={(value) => setSite((current) => ({ ...current, [field.key]: value }))} uploadFolder={section} imageAlt={t(field.zh, field.en)} /></> : <label><span>{t(field.zh, field.en)}{field.required ? " *" : ""}</span>{field.multiline ? <textarea className="field" value={String(site[field.key])} onChange={(event) => setSite((current) => ({ ...current, [field.key]: event.target.value }))} /> : <input className="field" value={String(site[field.key])} onChange={(event) => setSite((current) => ({ ...current, [field.key]: event.target.value }))} />}</label>}
      </div>)}
    </div>}
    {message && <div className="notice" role="status">{message}</div>}
  </div>;
}
