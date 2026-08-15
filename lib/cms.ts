import { promises as fs } from "fs";
import path from "path";
import { dbQuery, dbTransaction, hasDatabaseUrl } from "./db";
import { getSupabaseConfig, supabaseRest } from "./supabase";
import type { InfoArticle, NewsArticle, Product, QuoteRequest, SiteContent } from "./types";

const dataDir = path.join(process.cwd(), "data");
const productsFile = path.join(dataDir, "products.json");
const siteFile = path.join(dataDir, "site.json");
const quotesFile = path.join(dataDir, "quotes.json");
const newsFile = path.join(dataDir, "news.json");
const infoFile = path.join(dataDir, "info.json");

type ProductRow = {
  id: string;
  sku: string;
  catalog_no: string;
  cas: string;
  name_cn: string;
  name_en: string;
  synonyms: string;
  category: string;
  brand: string;
  formula: string;
  molecular_weight: string;
  purity: string;
  stock: number;
  package_size: string;
  price: number;
  lead_time: string;
  image: string;
  details: string;
  reference_text: string;
  certificate: string;
  scale_note: string;
  tags: string[];
};

type SiteRow = SiteContent & { id: string };
type QuoteRow = Omit<QuoteRequest, "createdAt" | "salesNote"> & {
  created_at: string | Date;
  sales_note: string;
};
type NewsRow = Omit<NewsArticle, "publishedAt" | "coverImage"> & {
  published_at: string | Date;
  cover_image: string;
};

async function readJson<T>(filePath: string): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [] as T;
    }
    throw error;
  }
}

async function writeJson<T>(filePath: string, value: T) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function useSupabase() {
  return getSupabaseConfig().enabled;
}

function requireWritableSupabase() {
  const config = getSupabaseConfig();
  if (config.enabled && !config.canWrite) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for CMS writes.");
  }
  return config.canWrite;
}

function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku || "",
    catalogNo: row.catalog_no || "",
    cas: row.cas || "",
    nameCn: row.name_cn || "",
    nameEn: row.name_en || "",
    synonyms: row.synonyms || "",
    category: row.category || "",
    brand: row.brand || "",
    formula: row.formula || "",
    molecularWeight: row.molecular_weight || "",
    purity: row.purity || "",
    stock: Number(row.stock || 0),
    packageSize: row.package_size || "",
    price: Number(row.price || 0),
    leadTime: row.lead_time || "",
    image: row.image || "",
    details: row.details || "",
    references: row.reference_text || "",
    certificate: row.certificate || "",
    scaleNote: row.scale_note || "",
    tags: Array.isArray(row.tags) ? row.tags : []
  };
}

function productToRow(product: Product): ProductRow {
  return {
    id: product.id,
    sku: product.sku || product.catalogNo || "",
    catalog_no: product.catalogNo || product.sku || "",
    cas: product.cas || "",
    name_cn: product.nameCn || "",
    name_en: product.nameEn || "",
    synonyms: product.synonyms || "",
    category: product.category || "",
    brand: product.brand || "",
    formula: product.formula || "",
    molecular_weight: product.molecularWeight || "",
    purity: product.purity || "",
    stock: Number(product.stock || 0),
    package_size: product.packageSize || "",
    price: Number(product.price || 0),
    lead_time: product.leadTime || "",
    image: product.image || "",
    details: product.details || "",
    reference_text: product.references || "",
    certificate: product.certificate || "",
    scale_note: product.scaleNote || "",
    tags: Array.isArray(product.tags) ? product.tags : []
  };
}

function quoteFromRow(row: QuoteRow): QuoteRequest {
  return {
    id: row.id,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    customer: row.customer,
    lines: row.lines,
    salesNote: row.sales_note || ""
  };
}

function quoteToRow(quote: QuoteRequest): QuoteRow {
  return {
    id: quote.id,
    status: quote.status,
    created_at: quote.createdAt,
    customer: quote.customer,
    lines: quote.lines,
    sales_note: quote.salesNote || ""
  };
}

function newsFromRow(row: NewsRow): NewsArticle {
  const publishedAt = row.published_at instanceof Date ? row.published_at.toISOString().slice(0, 10) : String(row.published_at).slice(0, 10);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    author: row.author,
    source: row.source,
    publishedAt,
    summary: row.summary,
    content: row.content,
    coverImage: row.cover_image || "",
    views: Number(row.views || 0),
    published: Boolean(row.published)
  };
}

function newsToRow(article: NewsArticle): NewsRow {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category || "公司新闻",
    author: article.author || "凯森斯生物",
    source: article.source || "凯森斯生物",
    published_at: article.publishedAt,
    summary: article.summary || "",
    content: article.content || "",
    cover_image: article.coverImage || "",
    views: Number(article.views || 0),
    published: Boolean(article.published)
  };
}

const siteDefaults: SiteContent = {
  brandName: "凯森斯生物 KASONS",
  tagline: "科研试剂与化学品采购平台",
  supportPhone: "400-800-1688",
  heroTitle: "凯森斯生物 KASONS 科研试剂、标准品与化学品产品库",
  heroDescription: "公开展示产品基础资料，报价统一通过询价获取。支持 CAS、货号、中英文名和分子式搜索，并用询价车承接采购需求。",
  primaryCta: "进入产品中心",
  notice: "",
  companyName: "凯森斯生物 KASONS",
  contactEmail: "support@biochemsyn.com",
  address: "上海市浦东新区 Demo Road 168 号",
  aboutTitle: "关于凯森斯生物",
  aboutDescription:
    "凯森斯生物 KASONS 专注于科研试剂、标准品与化学品的产品展示和采购询价服务，帮助研发、质控和采购团队更高效地检索产品信息、确认规格并提交询价。",
  aboutQrImage: "",
  contactTitle: "提交需求或联系凯森斯生物",
  contactDescription: "如需产品规格、批量供货、交期或替代品确认，可以通过电话、邮箱或询价表单提交需求。",
  contactQrImage: "",
  contactCta: "前往询价车"
};

function siteFromRow(row: SiteRow): SiteContent {
  const { id: _id, ...site } = row;
  return {
    ...siteDefaults,
    ...site
  };
}

export async function getProducts() {
  if (hasDatabaseUrl()) {
    const rows = await dbQuery<ProductRow>("select * from public.products order by catalog_no asc");
    return rows.map(productFromRow);
  }
  if (!useSupabase()) return readJson<Product[]>(productsFile);
  const rows = await supabaseRest<ProductRow[]>("products", { query: "?select=*&order=catalog_no.asc" });
  return rows.map(productFromRow);
}

export async function saveProducts(products: Product[]) {
  if (hasDatabaseUrl()) {
    const rows = products.map(productToRow);
    await dbTransaction(async (query) => {
      await query("delete from public.products");
      for (const row of rows) {
        await query(
          `insert into public.products (
            id, sku, catalog_no, cas, name_cn, name_en, synonyms, category, brand, formula,
            molecular_weight, purity, stock, package_size, price, lead_time, image,
            details, reference_text, certificate, scale_note, tags
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
          [
            row.id,
            row.sku,
            row.catalog_no,
            row.cas,
            row.name_cn,
            row.name_en,
            row.synonyms,
            row.category,
            row.brand,
            row.formula,
            row.molecular_weight,
            row.purity,
            row.stock,
            row.package_size,
            row.price,
            row.lead_time,
            row.image,
            row.details,
            row.reference_text,
            row.certificate,
            row.scale_note,
            row.tags
          ]
        );
      }
    });
    return;
  }
  if (!requireWritableSupabase()) {
    await writeJson(productsFile, products);
    return;
  }
  await supabaseRest("products", { method: "DELETE", query: "?id=not.is.null" });
  if (products.length > 0) {
    await supabaseRest("products", { method: "POST", body: products.map(productToRow), prefer: "return=representation" });
  }
}

export async function getSiteContent() {
  if (hasDatabaseUrl()) {
    const rows = await dbQuery<SiteRow>('select * from public.site_content where id = $1 limit 1', ["main"]);
    if (rows[0]) {
      return siteFromRow(rows[0]);
    }
    return { ...siteDefaults, ...(await readJson<Partial<SiteContent>>(siteFile)) };
  }
  if (!useSupabase()) return { ...siteDefaults, ...(await readJson<Partial<SiteContent>>(siteFile)) };
  const rows = await supabaseRest<SiteRow[]>("site_content", { query: "?select=*&id=eq.main&limit=1" });
  if (rows[0]) {
    return siteFromRow(rows[0]);
  }
  return { ...siteDefaults, ...(await readJson<Partial<SiteContent>>(siteFile)) };
}

export async function saveSiteContent(site: SiteContent) {
  const normalizedSite = { ...siteDefaults, ...site };
  if (hasDatabaseUrl()) {
    await dbQuery(
      `insert into public.site_content (
        id, "brandName", tagline, "supportPhone", "heroTitle", "heroDescription",
        "primaryCta", notice, "companyName", "contactEmail", address,
        "aboutTitle", "aboutDescription", "aboutQrImage",
        "contactTitle", "contactDescription", "contactQrImage", "contactCta"
      ) values ('main', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      on conflict (id) do update set
        "brandName" = excluded."brandName",
        tagline = excluded.tagline,
        "supportPhone" = excluded."supportPhone",
        "heroTitle" = excluded."heroTitle",
        "heroDescription" = excluded."heroDescription",
        "primaryCta" = excluded."primaryCta",
        notice = excluded.notice,
        "companyName" = excluded."companyName",
        "contactEmail" = excluded."contactEmail",
        address = excluded.address,
        "aboutTitle" = excluded."aboutTitle",
        "aboutDescription" = excluded."aboutDescription",
        "aboutQrImage" = excluded."aboutQrImage",
        "contactTitle" = excluded."contactTitle",
        "contactDescription" = excluded."contactDescription",
        "contactQrImage" = excluded."contactQrImage",
        "contactCta" = excluded."contactCta"`,
      [
        normalizedSite.brandName,
        normalizedSite.tagline,
        normalizedSite.supportPhone,
        normalizedSite.heroTitle,
        normalizedSite.heroDescription,
        normalizedSite.primaryCta,
        normalizedSite.notice,
        normalizedSite.companyName,
        normalizedSite.contactEmail,
        normalizedSite.address,
        normalizedSite.aboutTitle,
        normalizedSite.aboutDescription,
        normalizedSite.aboutQrImage,
        normalizedSite.contactTitle,
        normalizedSite.contactDescription,
        normalizedSite.contactQrImage,
        normalizedSite.contactCta
      ]
    );
    return;
  }
  if (!requireWritableSupabase()) {
    await writeJson(siteFile, normalizedSite);
    return;
  }
  await supabaseRest("site_content", {
    method: "POST",
    body: [{ id: "main", ...normalizedSite }],
    prefer: "resolution=merge-duplicates,return=representation"
  });
}

export async function getQuotes() {
  if (hasDatabaseUrl()) {
    const rows = await dbQuery<QuoteRow>("select * from public.quotes order by created_at desc");
    return rows.map(quoteFromRow);
  }
  if (!useSupabase()) return readJson<QuoteRequest[]>(quotesFile);
  const rows = await supabaseRest<QuoteRow[]>("quotes", { query: "?select=*&order=created_at.desc" });
  return rows.map(quoteFromRow);
}

export async function saveQuotes(quotes: QuoteRequest[]) {
  if (hasDatabaseUrl()) {
    await dbQuery("delete from public.quotes");
    for (const quote of quotes) {
      const row = quoteToRow(quote);
      await dbQuery(
        "insert into public.quotes (id, status, created_at, customer, lines, sales_note) values ($1, $2, $3, $4, $5, $6)",
        [row.id, row.status, row.created_at, JSON.stringify(row.customer), JSON.stringify(row.lines), row.sales_note]
      );
    }
    return;
  }
  if (!requireWritableSupabase()) {
    await writeJson(quotesFile, quotes);
    return;
  }
  await supabaseRest("quotes", { method: "DELETE", query: "?id=not.is.null" });
  if (quotes.length > 0) {
    await supabaseRest("quotes", { method: "POST", body: quotes.map(quoteToRow), prefer: "return=representation" });
  }
}

export async function getNewsArticles() {
  if (hasDatabaseUrl()) {
    const rows = await dbQuery<NewsRow>("select * from public.news_articles order by published_at desc");
    return rows.map(newsFromRow);
  }
  if (!useSupabase()) return readJson<NewsArticle[]>(newsFile);
  const rows = await supabaseRest<NewsRow[]>("news_articles", { query: "?select=*&order=published_at.desc" });
  return rows.map(newsFromRow);
}

export async function saveNewsArticles(news: NewsArticle[]) {
  if (hasDatabaseUrl()) {
    await dbQuery("delete from public.news_articles");
    for (const article of news) {
      const row = newsToRow(article);
      await dbQuery(
        `insert into public.news_articles (
          id, slug, title, category, author, source, published_at, summary,
          content, cover_image, views, published
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          row.id,
          row.slug,
          row.title,
          row.category,
          row.author,
          row.source,
          row.published_at,
          row.summary,
          row.content,
          row.cover_image,
          row.views,
          row.published
        ]
      );
    }
    return;
  }
  if (!requireWritableSupabase()) {
    await writeJson(newsFile, news);
    return;
  }
  await supabaseRest("news_articles", { method: "DELETE", query: "?id=not.is.null" });
  if (news.length > 0) {
    await supabaseRest("news_articles", { method: "POST", body: news.map(newsToRow), prefer: "return=representation" });
  }
}

export async function getInfoArticles() {
  if (hasDatabaseUrl()) {
    const rows = await dbQuery<NewsRow>("select * from public.info_articles order by published_at desc");
    return rows.map(newsFromRow) as InfoArticle[];
  }
  if (!useSupabase()) return readJson<InfoArticle[]>(infoFile);
  const rows = await supabaseRest<NewsRow[]>("info_articles", { query: "?select=*&order=published_at.desc" });
  return rows.map(newsFromRow) as InfoArticle[];
}

export async function saveInfoArticles(info: InfoArticle[]) {
  if (hasDatabaseUrl()) {
    await dbQuery("delete from public.info_articles");
    for (const article of info) {
      const row = newsToRow(article);
      await dbQuery(
        `insert into public.info_articles (
          id, slug, title, category, author, source, published_at, summary,
          content, cover_image, views, published
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          row.id,
          row.slug,
          row.title,
          row.category,
          row.author,
          row.source,
          row.published_at,
          row.summary,
          row.content,
          row.cover_image,
          row.views,
          row.published
        ]
      );
    }
    return;
  }
  if (!requireWritableSupabase()) {
    await writeJson(infoFile, info);
    return;
  }
  await supabaseRest("info_articles", { method: "DELETE", query: "?id=not.is.null" });
  if (info.length > 0) {
    await supabaseRest("info_articles", { method: "POST", body: info.map(newsToRow), prefer: "return=representation" });
  }
}

export async function getCategories() {
  const products = await getProducts();
  return Array.from(new Set(products.map((product) => product.category))).filter(Boolean);
}
