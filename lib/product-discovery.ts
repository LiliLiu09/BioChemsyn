import type { Product } from "./types";
import type { Locale } from "./i18n";
import { isProductAvailable, localizeProduct } from "./content-locale";
import { categoryForProduct } from "./catalog-seo";

export function readableText(value: string) {
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim();
}

export function productSearchDescription(product: Product, locale: Locale, name: string): string {
  const identity = `${name}${product.cas ? ` (CAS ${product.cas})` : ""}`;
  const paragraphs = product.details.replace(/<\/(?:p|div|h[1-6])\s*>|<br\s*\/?>/gi, "\n")
    .split(/\n+/).map(readableText);
  const isCopy = (paragraph: string) => paragraph.length > 35 && paragraph !== name;
  // Admin content usually starts with a name-only heading, sometimes bilingual.
  const copy = paragraphs.find((paragraph, index) => index > 0 && isCopy(paragraph)) || paragraphs.find(isCopy);
  const fallback = locale === "en"
    ? "View chemical identity and research reagent specifications. Request a quotation from KASONS."
    : "查看产品规格、分子式及货号，联系凯森斯生物获取报价与批次资料。";
  return `${identity}. ${copy || fallback}`.slice(0, locale === "en" ? 240 : 160);
}

function visibleUniqueProducts(products: Product[], locale: Locale) {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (!isProductAvailable(product, locale)) return false;
    const key = product.cas.trim() || product.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function relatedProducts(product: Product, products: Product[], locale: Locale) {
  const category = categoryForProduct(product);
  return visibleUniqueProducts(products.filter((item) => item.id !== product.id && (!product.cas || item.cas !== product.cas))
    .filter((item) => category ? categoryForProduct(item)?.slug === category.slug : Boolean(product.category) && item.category === product.category), locale)
    .slice(0, 4).map((item) => localizeProduct(item, locale));
}

export function mentionedProducts(text: string, products: Product[], locale: Locale) {
  const visible = readableText(text).toLowerCase().replace(/[′’]/g, "'");
  const contains = (term: string) => {
    const escaped = term.toLowerCase().replace(/[′’]/g, "'").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![a-z0-9-])${escaped}(?![a-z0-9-])`, "i").test(visible);
  };
  const matching = products.filter((product) => {
    if (!isProductAvailable(product, locale)) return false;
    const name = localizeProduct(product, locale).nameEn.trim();
    return (/^\d{2,7}-\d{2}-\d$/.test(product.cas) && contains(product.cas)) || (name.length >= 6 && contains(name));
  });
  return visibleUniqueProducts(matching, locale).slice(0, 6).map((product) => localizeProduct(product, locale));
}
