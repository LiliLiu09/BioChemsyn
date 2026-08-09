import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getSiteContent, saveSiteContent } from "@/lib/cms";
import type { SiteContent } from "@/lib/types";

export async function GET() {
  await requireAdmin();
  const site = await getSiteContent();
  return NextResponse.json({ site });
}

export async function PUT(request: Request) {
  await requireAdmin();
  const site = (await request.json()) as SiteContent;
  await saveSiteContent(site);
  return NextResponse.json({ ok: true, site });
}
