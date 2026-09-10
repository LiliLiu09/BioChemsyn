import type { Locale } from "@/lib/i18n";
import type { InfoArticle, NewsArticle, Product, SiteContent } from "@/lib/types";

// Never substitute a guessed chemical name or silently show Chinese copy on an English page.
const hanCharacters = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

export function isEnglishContent(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const decode = (text: string) => text.replace(/&#(x[0-9a-f]+|[0-9]+);?/gi, (entity, code: string) => {
    const point = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
  }).replace(/&(?:nbsp|ensp|emsp|thinsp|ZeroWidthSpace);/gi, " ");
  const visible = decode(value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<[^>]*>/g, ""));
  return Boolean(visible.replace(/[\s\u200b-\u200d\ufeff]/g, "")) && !hanCharacters.test(decode(value));
}

function englishText(value: unknown, fallback = "") {
  return isEnglishContent(value) ? value : fallback;
}

const knownTerms: Record<string, string> = {
  "生化试剂": "Biochemical reagents",
  "标准品": "Reference standards",
  "植物激素": "Plant hormones",
  "现货": "In stock",
  "维生素": "Vitamins",
  "热销": "Popular",
  "糖醇": "Sugar alcohols",
  "植物": "Plants",
  "小包装": "Small packs",
  "大包装": "Bulk packs",
  "公司新闻": "Company news",
  "产品资讯": "Product updates",
  "服务资讯": "Service information",
  "行业资讯": "Industry news",
  "凯森斯生物": "KASONS",
  "凯森斯生物 KASONS": "KASONS"
};

function sharedText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return Object.prototype.hasOwnProperty.call(knownTerms, value) ? knownTerms[value] : englishText(value, fallback);
}

export function isProductAvailable(product: Product, locale: Locale) {
  if (product.status !== "published" || product.deletedAt) return false;
  if (locale === "zh") return true;
  if (product.translations?.en && product.translations.en.published !== true) return false;
  return isEnglishContent(product.translations?.en?.nameEn) || isEnglishContent(product.nameEn);
}

export function localizeProduct(product: Product, locale: Locale): Product {
  if (product.contentLocale === locale) return product;
  const { translations, ...base } = product;
  if (locale === "zh") return { ...base, categoryKey: product.categoryKey || product.category || "未分类", contentLocale: locale };
  const en = translations?.en?.published === true ? translations.en : undefined;
  const name = englishText(en?.nameEn, englishText(product.nameEn, product.catalogNo || product.sku || "Product"));
  return {
    ...base,
    contentLocale: locale,
    categoryKey: product.categoryKey || product.category || "未分类",
    nameCn: name,
    nameEn: name,
    synonyms: englishText(en?.synonyms, sharedText(product.synonyms)),
    category: englishText(en?.category, sharedText(product.category, "Other products")),
    brand: englishText(en?.brand, sharedText(product.brand)),
    molecularWeight: englishText(en?.molecularWeight, sharedText(product.molecularWeight, "Available on request")),
    purity: englishText(en?.purity, sharedText(product.purity, "Available on request")),
    packageSize: englishText(en?.packageSize, sharedText(product.packageSize, "Available on request")),
    leadTime: englishText(en?.leadTime, sharedText(product.leadTime, "Please enquire")),
    image: en?.image || product.image,
    details: englishText(en?.details, englishText(product.details, "Please contact us for product details and specifications.")),
    references: englishText(en?.references, englishText(product.references)),
    certificate: englishText(en?.certificate, englishText(product.certificate)),
    scaleNote: englishText(en?.scaleNote, englishText(product.scaleNote, "Please enquire about available pack sizes.")),
    tags: (en?.tags ?? product.tags ?? []).map((tag) => sharedText(tag)).filter(Boolean)
  };
}

export function isArticleAvailable(article: NewsArticle | InfoArticle, locale: Locale) {
  if (!article.published) return false;
  if (locale === "zh") return true;
  if (article.contentLocale === "en") return isEnglishContent(article.title) && isEnglishContent(article.content);
  const en = article.translations?.en;
  return en?.published === true && isEnglishContent(en.title) && isEnglishContent(en.content);
}

export function localizeArticle<T extends NewsArticle | InfoArticle>(article: T, locale: Locale): T {
  if (article.contentLocale === locale) return article;
  const { translations, ...base } = article;
  if (locale === "zh") return { ...base, categoryKey: article.categoryKey || article.category, contentLocale: locale } as T;
  const en = translations?.en?.published === true ? translations.en : undefined;
  return {
    ...base,
    contentLocale: locale,
    title: englishText(en?.title, "Translation not available"),
    categoryKey: article.categoryKey || article.category,
    category: englishText(en?.category, sharedText(article.category, "Updates")),
    author: englishText(en?.author, sharedText(article.author)),
    source: englishText(en?.source, sharedText(article.source)),
    summary: englishText(en?.summary),
    content: englishText(en?.content),
    coverImage: en?.coverImage || article.coverImage,
    published: isArticleAvailable(article, locale)
  } as T;
}

export function localizeSiteContent(site: SiteContent, locale: Locale): SiteContent {
  if (site.contentLocale === locale) return site;
  const { translations, ...base } = site;
  if (locale === "zh") return { ...base, contentLocale: locale };
  const stored = translations?.en;
  const en = stored && (stored.sitePublished ?? stored.published) === true ? stored : undefined;
  const about = stored && (stored.aboutPublished ?? stored.published) === true ? stored : undefined;
  const contact = stored && (stored.contactPublished ?? stored.published) === true ? stored : undefined;
  return {
    ...base,
    contentLocale: locale,
    brandName: englishText(en?.brandName, sharedText(site.brandName, "KASONS")),
    companyName: englishText(en?.companyName, sharedText(site.companyName, "KASONS")),
    tagline: englishText(en?.tagline, englishText(site.tagline, "Research reagents and chemicals")),
    heroTitle: englishText(en?.heroTitle, englishText(site.heroTitle, "KASONS product catalogue")),
    heroDescription: englishText(en?.heroDescription, englishText(site.heroDescription, "Search products and send us your enquiry.")),
    primaryCta: englishText(en?.primaryCta, "Browse products"),
    notice: englishText(en?.notice, englishText(site.notice)),
    address: englishText(en?.address, englishText(site.address, "Please contact us for address details.")),
    aboutTitle: englishText(about?.aboutTitle, "About KASONS"),
    aboutDescription: englishText(about?.aboutDescription, englishText(site.aboutDescription, "Please contact us for more information about KASONS.")),
    aboutQrImage: about?.aboutQrImage || site.aboutQrImage,
    contactTitle: englishText(contact?.contactTitle, "Contact KASONS"),
    contactDescription: englishText(contact?.contactDescription, englishText(site.contactDescription, "Contact us by phone, email or through the enquiry form.")),
    contactQrImage: contact?.contactQrImage || site.contactQrImage,
    contactCta: englishText(contact?.contactCta, "Go to inquiry cart"),
    supportPhone: englishText(en?.supportPhone, englishText(site.supportPhone)),
    contactEmail: englishText(en?.contactEmail, englishText(site.contactEmail))
  };
}

// Each CMS section submits only its own fields; editing About must not replace Contact translations.
export function mergeSiteContent(current: SiteContent, patch: Partial<SiteContent>): SiteContent {
  return {
    ...current,
    ...patch,
    translations: {
      ...current.translations,
      ...patch.translations,
      en: { ...current.translations?.en, ...patch.translations?.en }
    }
  };
}
