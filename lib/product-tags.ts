export const FEATURED_PRODUCT_TAG = "明星产品";
export const FEATURED_PRODUCT_TAG_EN = "Featured product";

const internalProductTags = new Set([FEATURED_PRODUCT_TAG.toLowerCase(), FEATURED_PRODUCT_TAG_EN.toLowerCase()]);

export function isInternalProductTag(tag: string) {
  return internalProductTags.has(tag.trim().toLowerCase());
}

export function publicProductTags(tags: string[] | undefined) {
  return (tags || []).filter((tag) => !isInternalProductTag(tag));
}
