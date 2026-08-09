import { NextResponse } from "next/server";
import { getProducts, getQuotes, saveQuotes } from "@/lib/cms";
import type { QuoteCustomer, QuoteLine, QuoteRequest } from "@/lib/types";

type IncomingLine = {
  id?: string;
  qty?: number;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { customer?: Partial<QuoteCustomer>; lines?: IncomingLine[] };
  const customer: QuoteCustomer = {
    name: clean(body.customer?.name),
    company: clean(body.customer?.company),
    phone: clean(body.customer?.phone),
    email: clean(body.customer?.email),
    region: clean(body.customer?.region),
    remark: clean(body.customer?.remark)
  };

  const errors: Record<string, string> = {};
  if (!customer.name) errors.name = "请填写联系人姓名";
  if (!customer.company) errors.company = "请填写公司名称";
  if (!customer.phone) errors.phone = "请填写联系电话";
  if (!customer.email || !isEmail(customer.email)) errors.email = "请填写有效邮箱";
  if (!Array.isArray(body.lines) || body.lines.length === 0) errors.lines = "请先添加需要询价的产品";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const products = await getProducts();
  const lines: QuoteLine[] = (body.lines || [])
    .map((line) => {
      const product = products.find((item) => item.id === line.id);
      if (!product) return null;
      return {
        productId: product.id,
        sku: product.sku,
        nameCn: product.nameCn,
        nameEn: product.nameEn,
        cas: product.cas,
        packageSize: product.packageSize,
        qty: Math.max(1, Number(line.qty || 1))
      };
    })
    .filter((line): line is QuoteLine => Boolean(line));

  if (lines.length === 0) {
    return NextResponse.json({ errors: { lines: "询价产品不存在或已被删除" } }, { status: 400 });
  }

  const quote: QuoteRequest = {
    id: `Q${Date.now()}`,
    status: "待处理",
    createdAt: new Date().toISOString(),
    customer,
    lines,
    salesNote: ""
  };

  const quotes = await getQuotes();
  await saveQuotes([quote, ...quotes]);

  return NextResponse.json({ ok: true, quote });
}
