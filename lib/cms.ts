import { promises as fs } from "fs";
import path from "path";
import type { NewsArticle, Product, QuoteRequest, SiteContent } from "./types";

const dataDir = path.join(process.cwd(), "data");
const productsFile = path.join(dataDir, "products.json");
const siteFile = path.join(dataDir, "site.json");
const quotesFile = path.join(dataDir, "quotes.json");
const newsFile = path.join(dataDir, "news.json");

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

export async function getProducts() {
  return readJson<Product[]>(productsFile);
}

export async function saveProducts(products: Product[]) {
  await writeJson(productsFile, products);
}

export async function getSiteContent() {
  return readJson<SiteContent>(siteFile);
}

export async function saveSiteContent(site: SiteContent) {
  await writeJson(siteFile, site);
}

export async function getQuotes() {
  return readJson<QuoteRequest[]>(quotesFile);
}

export async function saveQuotes(quotes: QuoteRequest[]) {
  await writeJson(quotesFile, quotes);
}

export async function getNewsArticles() {
  return readJson<NewsArticle[]>(newsFile);
}

export async function saveNewsArticles(news: NewsArticle[]) {
  await writeJson(newsFile, news);
}

export async function getCategories() {
  const products = await getProducts();
  return Array.from(new Set(products.map((product) => product.category))).filter(Boolean);
}
