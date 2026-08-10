import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getProducts, saveProducts } from "@/lib/cms";
import type { Product } from "@/lib/types";

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    id: product.id || `p-${Date.now()}`,
    catalogNo: product.catalogNo || product.sku || "",
    synonyms: product.synonyms || "",
    molecularWeight: product.molecularWeight || "",
    image: product.image || "",
    details: product.details || "",
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
  const products = (body.products || []).map(normalizeProduct);

  await saveProducts(products);
  return NextResponse.json({ ok: true, products });
}
