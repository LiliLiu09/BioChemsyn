import { promises as fs } from "fs";
import path from "path";
import { revalidateTag, unstable_cache } from "next/cache";
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
  status?: "draft" | "published";
  deleted_at?: string | Date | null;
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
  translations?: Product["translations"];
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
  const config = getSupabaseConfig();
  if (config.url && !config.canWrite) {
    throw new Error("CMS reads require a server-side SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY or DATABASE_URL. Anonymous access to bilingual content is disabled to protect drafts.");
  }
  return config.enabled;
}

function requireWritableSupabase() {
  const config = getSupabaseConfig();
  if (config.enabled && !config.canWrite) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for CMS writes.");
  }
  return config.canWrite;
}

function productFromRow(row: ProductRow): Product {
  const deletedAt = row.deleted_at ? new Date(row.deleted_at).toISOString() : "";
  return {
    id: row.id,
    status: row.status === "draft" ? "draft" : "published",
    deletedAt,
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
    tags: Array.isArray(row.tags) ? row.tags : [],
    translations: row.translations || {}
  };
}

function productToRow(product: Product): ProductRow {
  return {
    id: product.id,
    status: product.status === "draft" ? "draft" : "published",
    deleted_at: product.deletedAt || null,
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
    tags: Array.isArray(product.tags) ? product.tags : [],
    translations: product.translations || {}
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
    published: Boolean(row.published),
    translations: row.translations || {}
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
    published: Boolean(article.published),
    translations: article.translations || {}
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
  // Old schema revisions also contain retired CMS fields; do not serialize those to public clients.
  const site = { ...siteDefaults };
  for (const key of Object.keys(siteDefaults) as Array<keyof typeof siteDefaults>) {
    if (key !== "translations" && key !== "contentLocale" && typeof row[key] === "string") {
      site[key] = row[key];
    }
  }
  return { ...site, translations: row.translations || {} };
}

type ArticleTable = "news_articles" | "info_articles";

const CACHE_SECONDS = 60 * 60;
const cacheTags = {
  products: "cms-products",
  site: "cms-site",
  news: "cms-news",
  info: "cms-info"
} as const;

const productListColumns = `
  id, status, deleted_at, sku, catalog_no, cas, name_cn, name_en, synonyms,
  category, brand, formula, molecular_weight, purity, stock, package_size,
  price, lead_time, image, ''::text as details, ''::text as reference_text,
  ''::text as certificate, scale_note, tags,
  jsonb_build_object('en', coalesce(translations->'en', '{}'::jsonb) - array['details','references','certificate']) as translations
`;

const articleListColumns = `
  id, slug, title, category, author, source, published_at, summary,
  ''::text as content, cover_image, views, published,
  jsonb_build_object(
    'en',
    (coalesce(translations->'en', '{}'::jsonb) - 'content') ||
      jsonb_build_object('content', case when coalesce(translations->'en'->>'content', '') <> '' then 'available' else '' end)
  ) as translations
`;

function compactArticle(article: NewsArticle): NewsArticle {
  const english = article.translations?.en;
  const { content: _content, ...englishListFields } = english || {};
  return {
    ...article,
    content: "",
    translations: english ? { en: { ...englishListFields, content: english.content ? "available" : "" } } : {}
  };
}

function invalidateCmsCache(tag: keyof typeof cacheTags) {
  revalidateTag(cacheTags[tag]);
}

async function saveArticlesInDatabase(table: ArticleTable, articles: NewsArticle[]) {
  const rows = articles.map(newsToRow);
  await dbTransaction(async (query) => {
    await query(`delete from public.${table}`);
    for (const row of rows) {
      await query(
        `insert into public.${table} (
          id, slug, title, category, author, source, published_at, summary,
          content, cover_image, views, published, translations
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)`,
        [
          row.id, row.slug, row.title, row.category, row.author, row.source,
          row.published_at, row.summary, row.content, row.cover_image,
          row.views, row.published, JSON.stringify(row.translations || {})
        ]
      );
    }
  });
}

async function saveArticlesWithSupabase(table: ArticleTable, articles: NewsArticle[]) {
  // Preserve existing rows if the bulk upsert fails. Delete only records absent from the saved list.
  const previous = await supabaseRest<Array<{ id: string }>>(table, { query: "?select=id" });
  const keepIds = new Set(articles.map((article) => article.id));
  if (articles.length > 0) {
    await supabaseRest(table, {
      method: "POST",
      query: "?on_conflict=id",
      body: articles.map(newsToRow),
      prefer: "resolution=merge-duplicates,return=representation"
    });
  }
  for (const row of previous) {
    if (!keepIds.has(row.id)) {
      await supabaseRest(table, { method: "DELETE", query: `?id=eq.${encodeURIComponent(row.id)}` });
    }
  }
}

async function loadProducts(includeInactive: boolean) {
  if (hasDatabaseUrl()) {
    const where = includeInactive ? "" : "where status = 'published' and deleted_at is null";
    const columns = includeInactive ? "*" : productListColumns;
    return (await dbQuery<ProductRow>(`select ${columns} from public.products ${where} order by catalog_no asc`)).map(productFromRow);
  }
  if (!useSupabase()) {
    const products = (await readJson<Product[]>(productsFile)).map((product) => ({
      ...product,
      status: product.status || "published",
      deletedAt: product.deletedAt || ""
    }));
    return includeInactive ? products : products.filter((product) => product.status === "published" && !product.deletedAt);
  }
  const rows = await supabaseRest<ProductRow[]>("products", {
    query: `?select=*&order=catalog_no.asc${includeInactive ? "" : "&status=eq.published&deleted_at=is.null"}`
  });
  const products = rows.map(productFromRow);
  return includeInactive ? products : products.filter((product) => product.status === "published" && !product.deletedAt);
}

const getCachedPublishedProducts = unstable_cache(
  () => loadProducts(false),
  ["cms-published-products"],
  { revalidate: CACHE_SECONDS, tags: [cacheTags.products] }
);

export async function getProducts(options: { includeInactive?: boolean } = {}) {
  return options.includeInactive ? loadProducts(true) : getCachedPublishedProducts();
}

async function loadProductById(id: string) {
  if (hasDatabaseUrl()) {
    const rows = await dbQuery<ProductRow>(
      "select * from public.products where id = $1 and status = 'published' and deleted_at is null limit 1",
      [id]
    );
    return rows[0] ? productFromRow(rows[0]) : null;
  }
  return (await loadProducts(false)).find((product) => product.id === id) || null;
}

const getCachedProductById = unstable_cache(
  (id: string) => loadProductById(id),
  ["cms-published-product-by-id"],
  { revalidate: CACHE_SECONDS, tags: [cacheTags.products] }
);

export async function getProductById(id: string) {
  return getCachedProductById(id);
}

export class BilingualMigrationRequiredError extends Error {
  constructor() {
    super("The bilingual content database migration is required before saving.");
    this.name = "BilingualMigrationRequiredError";
  }
}

async function ensureTranslationsColumn(table: "products" | "site_content" | "news_articles" | "info_articles") {
  try {
    if (hasDatabaseUrl()) {
      await dbQuery(`select translations from public.${table} limit 0`);
    } else if (useSupabase()) {
      await supabaseRest(table, { query: "?select=translations&limit=0" });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/translations/i.test(message) && /does not exist|schema cache|42703|PGRST20[04]/i.test(message)) {
      throw new BilingualMigrationRequiredError();
    }
    throw error;
  }
}

export async function saveProducts(products: Product[]) {
  await ensureTranslationsColumn("products");
  if (hasDatabaseUrl()) {
    const rows = products.map(productToRow);
    await dbTransaction(async (query) => {
      for (const row of rows) {
        await query(
          `insert into public.products (
            id, status, deleted_at, sku, catalog_no, cas, name_cn, name_en, synonyms, category, brand, formula,
            molecular_weight, purity, stock, package_size, price, lead_time, image,
            details, reference_text, certificate, scale_note, tags, translations
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25::jsonb)
          on conflict (id) do update set
            status = excluded.status,
            deleted_at = excluded.deleted_at,
            sku = excluded.sku,
            catalog_no = excluded.catalog_no,
            cas = excluded.cas,
            name_cn = excluded.name_cn,
            name_en = excluded.name_en,
            synonyms = excluded.synonyms,
            category = excluded.category,
            brand = excluded.brand,
            formula = excluded.formula,
            molecular_weight = excluded.molecular_weight,
            purity = excluded.purity,
            stock = excluded.stock,
            package_size = excluded.package_size,
            price = excluded.price,
            lead_time = excluded.lead_time,
            image = excluded.image,
            details = excluded.details,
            reference_text = excluded.reference_text,
            certificate = excluded.certificate,
            scale_note = excluded.scale_note,
            tags = excluded.tags,
            translations = excluded.translations,
            updated_at = now()`,
          [
            row.id,
            row.status,
            row.deleted_at,
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
            row.tags,
            JSON.stringify(row.translations || {})
          ]
        );
      }
    });
    invalidateCmsCache("products");
    return;
  }
  if (!requireWritableSupabase()) {
    await writeJson(productsFile, products);
    invalidateCmsCache("products");
    return;
  }
  if (products.length > 0) {
    await supabaseRest("products", { method: "POST", body: products.map(productToRow), prefer: "resolution=merge-duplicates,return=representation" });
  }
  invalidateCmsCache("products");
}

async function loadSiteContent() {
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

const getCachedSiteContent = unstable_cache(
  loadSiteContent,
  ["cms-site-content"],
  { revalidate: CACHE_SECONDS, tags: [cacheTags.site] }
);

export async function getSiteContent() {
  return getCachedSiteContent();
}

export async function saveSiteContent(site: SiteContent) {
  await ensureTranslationsColumn("site_content");
  const { contentLocale: _locale, ...siteFields } = site;
  const normalizedSite = { ...siteDefaults, ...siteFields, translations: site.translations || {} };
  if (hasDatabaseUrl()) {
    await dbQuery(
      `insert into public.site_content (
        id, "brandName", tagline, "supportPhone", "heroTitle", "heroDescription",
        "primaryCta", notice, "companyName", "contactEmail", address,
        "aboutTitle", "aboutDescription", "aboutQrImage",
        "contactTitle", "contactDescription", "contactQrImage", "contactCta", translations
      ) values ('main', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb)
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
        "contactCta" = excluded."contactCta",
        translations = excluded.translations`,
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
        normalizedSite.contactCta,
        JSON.stringify(normalizedSite.translations)
      ]
    );
    invalidateCmsCache("site");
    return;
  }
  if (!requireWritableSupabase()) {
    await writeJson(siteFile, normalizedSite);
    invalidateCmsCache("site");
    return;
  }
  await supabaseRest("site_content", {
    method: "POST",
    body: [{ id: "main", ...normalizedSite }],
    prefer: "resolution=merge-duplicates,return=representation"
  });
  invalidateCmsCache("site");
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

async function loadPublishedArticleList(table: ArticleTable, file: string, limit?: number) {
  if (hasDatabaseUrl()) {
    const values = limit ? [limit] : [];
    const limitClause = limit ? "limit $1" : "";
    const rows = await dbQuery<NewsRow>(
      `select ${articleListColumns} from public.${table} where published = true order by published_at desc ${limitClause}`,
      values
    );
    return rows.map(newsFromRow);
  }
  if (!useSupabase()) {
    const rows = (await readJson<NewsArticle[]>(file))
      .filter((article) => article.published)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return (limit ? rows.slice(0, limit) : rows).map(compactArticle);
  }
  const queryLimit = limit ? `&limit=${limit}` : "";
  const rows = await supabaseRest<NewsRow[]>(table, {
    query: `?select=*&published=eq.true&order=published_at.desc${queryLimit}`
  });
  return rows.map(newsFromRow).map(compactArticle);
}

const getCachedPublishedNews = unstable_cache(
  (limit?: number) => loadPublishedArticleList("news_articles", newsFile, limit),
  ["cms-published-news-list"],
  { revalidate: CACHE_SECONDS, tags: [cacheTags.news] }
);

const getCachedPublishedInfo = unstable_cache(
  (limit?: number) => loadPublishedArticleList("info_articles", infoFile, limit),
  ["cms-published-info-list"],
  { revalidate: CACHE_SECONDS, tags: [cacheTags.info] }
);

export async function getPublishedNewsArticles(limit?: number) {
  return getCachedPublishedNews(limit);
}

export async function getPublishedInfoArticles(limit?: number) {
  return (await getCachedPublishedInfo(limit)) as InfoArticle[];
}

async function loadPublishedArticleBySlug(table: ArticleTable, file: string, slug: string) {
  if (hasDatabaseUrl()) {
    const rows = await dbQuery<NewsRow>(
      `select * from public.${table} where slug = $1 and published = true limit 1`,
      [slug]
    );
    return rows[0] ? newsFromRow(rows[0]) : null;
  }
  if (!useSupabase()) {
    return (await readJson<NewsArticle[]>(file)).find((article) => article.slug === slug && article.published) || null;
  }
  const rows = await supabaseRest<NewsRow[]>(table, {
    query: `?select=*&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`
  });
  return rows[0] ? newsFromRow(rows[0]) : null;
}

const getCachedPublishedNewsBySlug = unstable_cache(
  (slug: string) => loadPublishedArticleBySlug("news_articles", newsFile, slug),
  ["cms-published-news-by-slug"],
  { revalidate: CACHE_SECONDS, tags: [cacheTags.news] }
);

const getCachedPublishedInfoBySlug = unstable_cache(
  (slug: string) => loadPublishedArticleBySlug("info_articles", infoFile, slug),
  ["cms-published-info-by-slug"],
  { revalidate: CACHE_SECONDS, tags: [cacheTags.info] }
);

export async function getPublishedNewsArticleBySlug(slug: string) {
  return getCachedPublishedNewsBySlug(slug);
}

export async function getPublishedInfoArticleBySlug(slug: string) {
  return (await getCachedPublishedInfoBySlug(slug)) as InfoArticle | null;
}

export async function saveNewsArticles(news: NewsArticle[]) {
  // Check before any writes so a missing migration cannot affect existing content.
  await ensureTranslationsColumn("news_articles");
  if (hasDatabaseUrl()) {
    await saveArticlesInDatabase("news_articles", news);
    invalidateCmsCache("news");
    return;
  }
  if (!requireWritableSupabase()) {
    await writeJson(newsFile, news);
    invalidateCmsCache("news");
    return;
  }
  await saveArticlesWithSupabase("news_articles", news);
  invalidateCmsCache("news");
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
  await ensureTranslationsColumn("info_articles");
  if (hasDatabaseUrl()) {
    await saveArticlesInDatabase("info_articles", info);
    invalidateCmsCache("info");
    return;
  }
  if (!requireWritableSupabase()) {
    await writeJson(infoFile, info);
    invalidateCmsCache("info");
    return;
  }
  await saveArticlesWithSupabase("info_articles", info);
  invalidateCmsCache("info");
}

export type PublicSearchData = {
  products: Product[];
  news: NewsArticle[];
  info: InfoArticle[];
};

export async function searchPublicContent(query: string, limitPerGroup = 30): Promise<PublicSearchData> {
  const keyword = query.trim();
  if (!keyword) return { products: [], news: [], info: [] };

  if (hasDatabaseUrl()) {
    const pattern = `%${keyword}%`;
    const [productRows, newsRows, infoRows] = await Promise.all([
      dbQuery<ProductRow>(
        `select ${productListColumns} from public.products
         where status = 'published' and deleted_at is null
           and concat_ws(' ', sku, catalog_no, cas, name_cn, name_en, synonyms, category, brand, formula, molecular_weight,
             translations->'en'->>'nameEn', translations->'en'->>'synonyms', translations->'en'->>'category',
             translations->'en'->>'brand', translations->'en'->>'molecularWeight') ilike $1
         order by catalog_no asc limit $2`,
        [pattern, limitPerGroup]
      ),
      dbQuery<NewsRow>(
        `select ${articleListColumns} from public.news_articles
         where published = true
           and concat_ws(' ', title, category, summary, content, author, source,
             translations->'en'->>'title', translations->'en'->>'category', translations->'en'->>'summary',
             translations->'en'->>'content', translations->'en'->>'author', translations->'en'->>'source') ilike $1
         order by published_at desc limit $2`,
        [pattern, limitPerGroup]
      ),
      dbQuery<NewsRow>(
        `select ${articleListColumns} from public.info_articles
         where published = true
           and concat_ws(' ', title, category, summary, content, author, source,
             translations->'en'->>'title', translations->'en'->>'category', translations->'en'->>'summary',
             translations->'en'->>'content', translations->'en'->>'author', translations->'en'->>'source') ilike $1
         order by published_at desc limit $2`,
        [pattern, limitPerGroup]
      )
    ]);
    return {
      products: productRows.map(productFromRow),
      news: newsRows.map(newsFromRow),
      info: infoRows.map(newsFromRow) as InfoArticle[]
    };
  }

  const needle = keyword.toLowerCase();
  const includesKeyword = (values: unknown[]) => values.join(" ").toLowerCase().includes(needle);
  const [products, news, info] = await Promise.all([
    getProducts(),
    getPublishedNewsArticles(),
    getPublishedInfoArticles()
  ]);
  return {
    products: products.filter((product) => includesKeyword([product.sku, product.catalogNo, product.cas, product.nameCn, product.nameEn, product.synonyms, product.category, product.brand, product.formula, product.molecularWeight, product.tags])).slice(0, limitPerGroup),
    news: news.filter((article) => includesKeyword([article.title, article.category, article.summary, article.author, article.source])).slice(0, limitPerGroup),
    info: info.filter((article) => includesKeyword([article.title, article.category, article.summary, article.author, article.source])).slice(0, limitPerGroup)
  };
}

export async function getAdminOverviewCounts() {
  if (hasDatabaseUrl()) {
    const rows = await dbQuery<{
      products: string;
      pending_quotes: string;
      processed_quotes: string;
      published_news: string;
      published_info: string;
    }>(
      `select
         (select count(*) from public.products where status = 'published' and deleted_at is null)::bigint as products,
         (select count(*) from public.quotes where status <> '已处理')::bigint as pending_quotes,
         (select count(*) from public.quotes where status = '已处理')::bigint as processed_quotes,
         (select count(*) from public.news_articles where published = true)::bigint as published_news,
         (select count(*) from public.info_articles where published = true)::bigint as published_info`
    );
    const row = rows[0];
    return {
      products: Number(row?.products || 0),
      pendingQuotes: Number(row?.pending_quotes || 0),
      processedQuotes: Number(row?.processed_quotes || 0),
      publishedNews: Number(row?.published_news || 0),
      publishedInfo: Number(row?.published_info || 0)
    };
  }

  const [products, quotes, news, info] = await Promise.all([getProducts(), getQuotes(), getNewsArticles(), getInfoArticles()]);
  return {
    products: products.length,
    pendingQuotes: quotes.filter((quote) => quote.status !== "已处理").length,
    processedQuotes: quotes.filter((quote) => quote.status === "已处理").length,
    publishedNews: news.filter((article) => article.published).length,
    publishedInfo: info.filter((article) => article.published).length
  };
}

export async function getCategories() {
  const products = await getProducts();
  return Array.from(new Set(products.map((product) => product.category))).filter(Boolean);
}
