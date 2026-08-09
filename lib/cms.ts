import { promises as fs } from "fs";
import path from "path";
import type { Product, SiteContent } from "./types";

const dataDir = path.join(process.cwd(), "data");
const productsFile = path.join(dataDir, "products.json");
const siteFile = path.join(dataDir, "site.json");

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
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

export async function getCategories() {
  const products = await getProducts();
  return Array.from(new Set(products.map((product) => product.category))).filter(Boolean);
}
