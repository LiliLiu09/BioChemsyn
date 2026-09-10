export type Product = {
  categoryKey?: string;
  contentLocale?: "zh" | "en";
  id: string;
  status: "draft" | "published";
  deletedAt: string;
  sku: string;
  catalogNo: string;
  cas: string;
  nameCn: string;
  nameEn: string;
  synonyms: string;
  category: string;
  brand: string;
  formula: string;
  molecularWeight: string;
  purity: string;
  stock: number;
  packageSize: string;
  price: number;
  leadTime: string;
  image: string;
  details: string;
  references: string;
  certificate: string;
  scaleNote: string;
  tags: string[];
  translations?: { en?: ProductTranslation };
};

export type ProductTranslation = Partial<Pick<Product,
  "nameEn" | "synonyms" | "category" | "brand" | "molecularWeight" |
  "purity" | "packageSize" | "leadTime" | "image" | "details" |
  "references" | "certificate" | "scaleNote" | "tags"
>> & { published?: boolean };

export type QuoteCustomer = {
  name: string;
  company: string;
  phone: string;
  email: string;
  region: string;
  remark: string;
};

export type QuoteLine = {
  productId: string;
  sku: string;
  nameCn: string;
  nameEn: string;
  cas: string;
  packageSize: string;
  qty: number;
};

export type QuoteRequest = {
  id: string;
  status: "待处理" | "已报价" | "已关闭" | "已处理";
  createdAt: string;
  customer: QuoteCustomer;
  lines: QuoteLine[];
  salesNote: string;
};

export type NewsArticle = {
  categoryKey?: string;
  contentLocale?: "zh" | "en";
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  source: string;
  publishedAt: string;
  summary: string;
  content: string;
  coverImage: string;
  views: number;
  published: boolean;
  translations?: { en?: ArticleTranslation };
};

export type InfoArticle = {
  categoryKey?: string;
  contentLocale?: "zh" | "en";
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  source: string;
  publishedAt: string;
  summary: string;
  content: string;
  coverImage: string;
  views: number;
  published: boolean;
  translations?: { en?: ArticleTranslation };
};

export type ArticleTranslation = Partial<Pick<NewsArticle,
  "title" | "category" | "author" | "source" | "summary" | "content" | "coverImage"
>> & { published?: boolean };

export type SiteContent = {
  contentLocale?: "zh" | "en";
  brandName: string;
  tagline: string;
  supportPhone: string;
  heroTitle: string;
  heroDescription: string;
  primaryCta: string;
  notice: string;
  companyName: string;
  contactEmail: string;
  address: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutQrImage: string;
  contactTitle: string;
  contactDescription: string;
  contactQrImage: string;
  contactCta: string;
  translations?: { en?: SiteContentTranslation };
};

export type SiteContentTranslation = Partial<Omit<SiteContent, "translations" | "contentLocale">> & {
  published?: boolean;
  sitePublished?: boolean;
  aboutPublished?: boolean;
  contactPublished?: boolean;
};
