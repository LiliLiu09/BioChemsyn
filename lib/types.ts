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
