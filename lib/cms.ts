import { promises as fs } from "fs";
import path from "path";
import { dbQuery, hasDatabaseUrl } from "./db";
import { getSupabaseConfig, supabaseRest } from "./supabase";
import type { NewsArticle, Product, QuoteRequest, SiteContent } from "./types";

const dataDir = path.join(process.cwd(), "data");
const productsFile = path.join(dataDir, "products.json");
const siteFile = path.join(dataDir, "site.json");
const quotesFile = path.join(dataDir, "quotes.json");
const newsFile = path.join(dataDir, "news.json");

type ProductRow = {
  id: string;
  sku: string;
  catalog_no: string;
  cas: string;
  name_cn: string;
  name_en: string;
  synonyms: string;
  category: string;
  formula: string;
  molecular_weight: string;
  purity: string;
  stock: number;
  package_size: string;
  price: number;
  lead_time: string;
  image: string;
  details: string;
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
    formula: row.formula || "",
    molecularWeight: row.molecular_weight || "",
    purity: row.purity || "",
    stock: Number(row.stock || 0),
    packageSize: row.package_size || "",
    price: Number(row.price || 0),
    leadTime: row.lead_time || "",
    image: row.image || "",
    details: row.details || "",
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
    formula: product.formula || "",
    molecular_weight: product.molecularWeight || "",
    purity: product.purity || "",
    stock: Number(product.stock || 0),
    package_size: product.packageSize || "",
    price: Number(product.price || 0),
    lead_time: product.leadTime || "",
    image: product.image || "",
    details: product.details || "",
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

function siteFromRow(row: SiteRow): SiteContent {
  return {
    brandName: row.brandName,
    tagline: row.tagline,
    supportPhone: row.supportPhone,
    heroTitle: row.heroTitle,
    heroDescription: row.heroDescription,
    primaryCta: row.primaryCta,
    notice: row.notice,
    companyName: row.companyName,
    contactEmail: row.contactEmail,
    address: row.address
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
    await dbQuery("delete from public.products");
    for (const product of products) {
      await dbQuery(
        `insert into public.products (
          id, sku, catalog_no, cas, name_cn, name_en, synonyms, category, formula,
          molecular_weight, purity, stock, package_size, price, lead_time, image,
          details, scale_note, tags
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        Object.values(productToRow(product))
      );
    }
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
    return readJson<SiteContent>(siteFile);
  }
  if (!useSupabase()) return readJson<SiteContent>(siteFile);
  const rows = await supabaseRest<SiteRow[]>("site_content", { query: "?select=*&id=eq.main&limit=1" });
  if (rows[0]) {
    return siteFromRow(rows[0]);
  }
  return readJson<SiteContent>(siteFile);
}

export async function saveSiteContent(site: SiteContent) {
  if (hasDatabaseUrl()) {
    await dbQuery(
      `insert into public.site_content (
        id, "brandName", tagline, "supportPhone", "heroTitle", "heroDescription",
        "primaryCta", notice, "companyName", "contactEmail", address
      ) values ('main', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        address = excluded.address`,
      [
        site.brandName,
        site.tagline,
        site.supportPhone,
        site.heroTitle,
        site.heroDescription,
        site.primaryCta,
        site.notice,
        site.companyName,
        site.contactEmail,
        site.address
      ]
    );
    return;
  }
  if (!requireWritableSupabase()) {
    await writeJson(siteFile, site);
    return;
  }
  await supabaseRest("site_content", {
    method: "POST",
    body: [{ id: "main", ...site }],
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

export async function getCategories() {
  const products = await getProducts();
  return Array.from(new Set(products.map((product) => product.category))).filter(Boolean);
}
