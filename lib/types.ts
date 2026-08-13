export type Product = {
  id: string;
  sku: string;
  catalogNo: string;
  cas: string;
  nameCn: string;
  nameEn: string;
  synonyms: string;
  category: string;
  formula: string;
  molecularWeight: string;
  purity: string;
  stock: number;
  packageSize: string;
  price: number;
  leadTime: string;
  image: string;
  details: string;
  scaleNote: string;
  tags: string[];
};

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
};

export type InfoArticle = {
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
};

export type SiteContent = {
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
  contactCta: string;
};
