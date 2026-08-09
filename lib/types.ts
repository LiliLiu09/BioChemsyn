export type Product = {
  id: string;
  sku: string;
  cas: string;
  nameCn: string;
  nameEn: string;
  category: string;
  formula: string;
  purity: string;
  stock: number;
  packageSize: string;
  price: number;
  leadTime: string;
  image: string;
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
  status: "待处理" | "已报价" | "已关闭";
  createdAt: string;
  customer: QuoteCustomer;
  lines: QuoteLine[];
  salesNote: string;
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
};
