import type { TranslationField } from "@/components/TranslationEditor";

export const articleTranslationFields: TranslationField[] = [
  { key: "title", zh: "英文标题", en: "English title", required: true },
  { key: "category", zh: "英文分类", en: "English category" },
  { key: "author", zh: "英文作者", en: "Author" },
  { key: "source", zh: "英文来源", en: "Source" },
  { key: "coverImage", zh: "英文封面图片地址（留空共用中文封面）", en: "English cover URL (leave blank to share the Chinese cover)" },
  { key: "summary", zh: "英文摘要", en: "English summary", multiline: true },
  { key: "content", zh: "英文正文", en: "English content", rich: true, required: true }
];

export const productTranslationFields: TranslationField[] = [
  { key: "nameEn", zh: "英文名称", en: "English product name", required: true },
  { key: "category", zh: "英文分类", en: "English category" },
  { key: "brand", zh: "英文品牌", en: "Brand" },
  { key: "synonyms", zh: "英文同义词", en: "Synonyms" },
  { key: "molecularWeight", zh: "分子量", en: "Molecular weight" },
  { key: "purity", zh: "英文纯度说明", en: "Purity" },
  { key: "packageSize", zh: "英文包装说明", en: "Pack size" },
  { key: "leadTime", zh: "英文货期", en: "Lead time" },
  { key: "image", zh: "英文图片地址（留空共用中文图片）", en: "English image URL (leave blank to share the Chinese image)" },
  { key: "tags", zh: "英文标签（逗号分隔）", en: "English tags (comma-separated)" },
  { key: "details", zh: "英文基本信息", en: "English details", rich: true },
  { key: "references", zh: "英文参考文献", en: "References", multiline: true },
  { key: "certificate", zh: "英文质检证书", en: "Certificate", multiline: true },
  { key: "scaleNote", zh: "英文规模说明", en: "Scale information", multiline: true }
];
