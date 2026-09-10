"use client";

import { RichTextEditor } from "@/components/RichTextEditor";
import { useLanguage } from "@/components/LanguageProvider";
import { isEnglishContent } from "@/lib/content-locale";

export type ContentLanguage = "zh" | "en";
export type TranslationField = { key: string; zh: string; en: string; multiline?: boolean; rich?: boolean; required?: boolean };
type TranslationValues = { [key: string]: string | string[] | boolean | undefined };

export function isEnglishReady(values: TranslationValues, required: string[]) {
  return required.every((key) => isEnglishContent(values[key]));
}

export function ContentLanguageTabs({ value, onChange, ready }: { value: ContentLanguage; onChange: (language: ContentLanguage) => void; ready: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="content-language-controls">
      <div className="product-status-tabs" role="group" aria-label={t("编辑内容语言", "Content language")}>
        <button type="button" className={value === "zh" ? "active" : ""} aria-pressed={value === "zh"} onClick={() => onChange("zh")}>{t("中文内容", "Chinese content")}</button>
        <button type="button" className={value === "en" ? "active" : ""} aria-pressed={value === "en"} onClick={() => onChange("en")}>English</button>
      </div>
      <p className="result-count">{ready ? t("英文必要内容已填写，发布前请校对。", "Required English content is complete. Review before publishing.") : t("英文待补充：填写英文必要内容后可发布。", "English is incomplete. Complete the required fields before publishing.")}</p>
    </div>
  );
}

export function TranslationEditor({ values, fields, onChange, uploadFolder, ready, publishable = true }: {
  values: TranslationValues;
  fields: TranslationField[];
  onChange: (key: string, value: string | string[] | boolean) => void;
  uploadFolder: string;
  ready: boolean;
  publishable?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="admin-form-grid" lang="en">
      {fields.map((field) => {
        const raw = values[field.key];
        const value = Array.isArray(raw) ? raw.join(", ") : typeof raw === "string" ? raw : "";
        return (
          <div className={`admin-field ${field.multiline || field.rich ? "full" : ""}`} key={field.key}>
            {field.rich ? (
              <>
                <span>{t(field.zh, field.en)}{field.required ? " *" : ""}</span>
                <RichTextEditor value={value} onChange={(next) => onChange(field.key, next)} uploadFolder={uploadFolder} imageAlt={field.en} />
              </>
            ) : (
              <label>
                <span>{t(field.zh, field.en)}{field.required ? " *" : ""}</span>
                {field.multiline ? <textarea className="field" value={value} onChange={(event) => onChange(field.key, event.target.value)} /> : <input className="field" value={value} onChange={(event) => onChange(field.key, field.key === "tags" ? event.target.value.split(/[,;，]/).map((tag) => tag.trim()) : event.target.value)} />}
              </label>
            )}
          </div>
        );
      })}
      {publishable && <label className="admin-field full checkbox-field">
        <input type="checkbox" checked={values.published === true && ready} disabled={!ready} onChange={(event) => onChange("published", event.target.checked)} />
        <span>{t("发布英文版本（中文发布状态独立维护）", "Publish the English version (Chinese publication is managed separately)")}</span>
      </label>}
    </div>
  );
}
