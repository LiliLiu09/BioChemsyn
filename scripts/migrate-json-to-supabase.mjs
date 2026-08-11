import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { loadLocalEnv } from "./env.mjs";

const root = process.cwd();
await loadLocalEnv(root);

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

async function readJson(file) {
  return JSON.parse(await readFile(path.join(root, "data", file), "utf8"));
}

function productToRow(product) {
  return [
    product.id,
    product.sku || product.catalogNo || "",
    product.catalogNo || product.sku || "",
    product.cas || "",
    product.nameCn || "",
    product.nameEn || "",
    product.synonyms || "",
    product.category || "",
    product.formula || "",
    product.molecularWeight || "",
    product.purity || "",
    Number(product.stock || 0),
    product.packageSize || "",
    Number(product.price || 0),
    product.leadTime || "",
    product.image || "",
    product.details || "",
    product.scaleNote || "",
    Array.isArray(product.tags) ? product.tags : []
  ];
}

function newsToRow(article) {
  return [
    article.id,
    article.slug,
    article.title,
    article.category || "公司新闻",
    article.author || "凯森斯生物",
    article.source || "凯森斯生物",
    article.publishedAt,
    article.summary || "",
    article.content || "",
    article.coverImage || "",
    Number(article.views || 0),
    Boolean(article.published)
  ];
}

function quoteToRow(quote) {
  return [
    quote.id,
    quote.status || "待处理",
    quote.createdAt || new Date().toISOString(),
    JSON.stringify(quote.customer || {}),
    JSON.stringify(quote.lines || []),
    quote.salesNote || ""
  ];
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const products = await readJson("products.json");
const news = await readJson("news.json");
const quotes = await readJson("quotes.json");
const site = await readJson("site.json");

await client.connect();
try {
  await client.query("begin");

  await client.query("delete from public.products");
  for (const product of products) {
    await client.query(
      `insert into public.products (
        id, sku, catalog_no, cas, name_cn, name_en, synonyms, category, formula,
        molecular_weight, purity, stock, package_size, price, lead_time, image,
        details, scale_note, tags
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      productToRow(product)
    );
  }

  await client.query("delete from public.news_articles");
  for (const article of news) {
    await client.query(
      `insert into public.news_articles (
        id, slug, title, category, author, source, published_at, summary,
        content, cover_image, views, published
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      newsToRow(article)
    );
  }

  await client.query("delete from public.quotes");
  for (const quote of quotes) {
    await client.query(
      `insert into public.quotes (
        id, status, created_at, customer, lines, sales_note
      ) values ($1, $2, $3, $4, $5, $6)`,
      quoteToRow(quote)
    );
  }

  await client.query(
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

  await client.query("commit");
  console.log(`Migrated ${products.length} products, ${news.length} news articles, ${quotes.length} quotes, and site content.`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
