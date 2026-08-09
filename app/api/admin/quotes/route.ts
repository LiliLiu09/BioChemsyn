import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getQuotes, saveQuotes } from "@/lib/cms";
import type { QuoteRequest } from "@/lib/types";

export async function GET() {
  await requireAdmin();
  const quotes = await getQuotes();
  return NextResponse.json({ quotes });
}

export async function PUT(request: Request) {
  await requireAdmin();
  const body = (await request.json()) as { quotes?: QuoteRequest[] };
  const quotes = Array.isArray(body.quotes) ? body.quotes : [];
  await saveQuotes(quotes);
  return NextResponse.json({ ok: true, quotes });
}
