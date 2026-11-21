import type { Product, ProductTranslation } from "./types";
import { isEnglishContent } from "./content-locale";
import { englishProductCategory } from "./product-category-translations";

export function englishTranslationFor(product: Product): ProductTranslation {
  const stored = product.translations?.en;
  return {
    ...stored,
    nameEn: stored?.nameEn ?? product.nameEn,
    category: stored?.category ?? englishProductCategory(product.category),
    published: stored?.published === true
  };
}

export function bilingualProductErrors(product: Product) {
  const errors: Array<"catalogNo" | "image" | "englishName" | "englishCategory"> = [];
  const english = englishTranslationFor(product);
  if (!(product.catalogNo || product.sku).trim()) errors.push("catalogNo");
  if (!product.image.trim()) errors.push("image");
  if (!isEnglishContent(english.nameEn)) errors.push("englishName");
  if (!isEnglishContent(english.category)) errors.push("englishCategory");
  return errors;
}

export function withBilingualPublication(product: Product, status: Product["status"]): Product {
  if (status === "published" && bilingualProductErrors(product).length) {
    throw new Error("Complete the required product fields before publishing both languages.");
  }
  const english = englishTranslationFor(product);
  return {
    ...product,
    nameEn: english.nameEn || "",
    status,
    deletedAt: "",
    translations: { ...product.translations, en: { ...english, molecularWeight: product.molecularWeight, published: status === "published" } }
  };
}
