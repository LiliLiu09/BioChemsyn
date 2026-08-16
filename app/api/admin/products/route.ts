import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getProducts, saveProducts } from "@/lib/cms";
import type { Product } from "@/lib/types";

function nextProductId(products: Array<Pick<Product, "id">>) {
  const maxId = products.reduce((max, product) => {
    const match = product.id.match(/^p-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `p-${maxId + 1}`;
}

function normalizeProduct(product: Product, fallbackId: string): Product {
  return {
    ...product,
    id: product.id || fallbackId,
    catalogNo: product.catalogNo || product.sku || "",
    sku: product.sku || product.catalogNo || "",
    synonyms: product.synonyms || "",
    molecularWeight: product.molecularWeight || "",
    category: product.category || "",
    brand: product.brand || "",
    purity: product.purity || "",
    leadTime: product.leadTime || "",
    image: product.image || "",
    details: product.details || "",
    references: product.references || "",
    certificate: product.certificate || "",
    scaleNote: product.scaleNote || "",
    stock: Number(product.stock || 0),
    price: Number(product.price || 0),
    tags: Array.isArray(product.tags) ? product.tags : []
  };
}

export async function GET() {
  await requireAdmin();
  const products = await getProducts();
  return NextResponse.json({ products });
}

export async function PUT(request: Request) {
  await requireAdmin();
  const body = (await request.json()) as { products?: Product[] };
  let nextIdNumber = Number(nextProductId(body.products || []).replace(/^p-/, ""));
  const products = (body.products || []).map((product) => {
    const normalized = normalizeProduct(product, `p-${nextIdNumber}`);
    if (!product.id) nextIdNumber += 1;
    return normalized;
  });

  await saveProducts(products);
  return NextResponse.json({ ok: true, products });
}
