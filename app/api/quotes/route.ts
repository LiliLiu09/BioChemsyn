import { NextResponse } from "next/server";
import { getProducts, getQuotes, saveQuotes } from "@/lib/cms";
import { sendQuoteNotification } from "@/lib/email";
import type { QuoteCustomer, QuoteLine, QuoteRequest } from "@/lib/types";
import { translate } from "@/lib/i18n";

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
  const body = (await request.json()) as { customer?: Partial<QuoteCustomer>; lines?: IncomingLine[]; locale?: string };
  const locale = body.locale === "en" ? "en" : "zh";
  const t = (zh: string, en: string) => translate(locale, zh, en);
  const customer: QuoteCustomer = {
    name: clean(body.customer?.name),
    company: clean(body.customer?.company),
    phone: clean(body.customer?.phone),
    email: clean(body.customer?.email),
    region: clean(body.customer?.region),
    remark: clean(body.customer?.remark)
  };

  const errors: Record<string, string> = {};
  if (!customer.name) errors.name = t("请填写联系人姓名", "Enter a contact name");
  if (!customer.company) errors.company = t("请填写公司名称", "Enter a company name");
  if (!customer.phone) errors.phone = t("请填写联系电话", "Enter a phone number");
  if (!customer.email || !isEmail(customer.email)) errors.email = t("请填写有效邮箱", "Enter a valid email address");
  if (!Array.isArray(body.lines) || body.lines.length === 0) errors.lines = t("请先添加需要询价的产品", "Add products before requesting a quotation");

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
    return NextResponse.json({ errors: { lines: t("询价产品不存在或已被删除", "These products are no longer available. Please update your inquiry cart.") } }, { status: 400 });
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

  const email = await sendQuoteNotification(quote);

  return NextResponse.json({ ok: true, quote, email });
}
