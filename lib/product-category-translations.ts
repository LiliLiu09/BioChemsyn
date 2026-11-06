const hanCharacters = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

export const productCategoryTranslations: Record<string, string> = {
  "人乳寡糖（HMO）": "Human Milk Oligosaccharides (HMOs)",
  "单糖": "Monosaccharides",
  "UDP-糖": "UDP-Sugars",
  "修饰型 UDP-糖": "Modified UDP-Sugars",
  "GDP-糖": "GDP-Sugars",
  "修饰型 GDP-糖": "Modified GDP-Sugars",
  "CMP-唾液酸/非酮糖": "CMP-Sialic Acids / Nonulosonic Acids",
  "ADP-糖": "ADP-Sugars",
  "血型抗原/肿瘤相关糖抗原": "Blood Group / Tumor-Associated Carbohydrate Antigens",
  "糖鞘脂相关寡糖": "Glycosphingolipid-Related Oligosaccharides",
  "其他寡糖/糖链标准品": "Other Oligosaccharides / Glycan Standards",
  "核苷多磷酸": "Nucleoside Polyphosphates",
  "待人工细分": "Other Carbohydrates"
};

export function englishProductCategory(category: string) {
  const normalized = category.trim();
  if (!normalized) return "";
  return productCategoryTranslations[normalized] || (hanCharacters.test(normalized) ? "" : normalized);
}
