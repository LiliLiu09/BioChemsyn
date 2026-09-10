import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getSiteContent, saveSiteContent } from "@/lib/cms";
import { mergeSiteContent } from "@/lib/content-locale";
import type { SiteContent } from "@/lib/types";
import { contentSaveError } from "../content-errors";

export async function GET() {
  await requireAdmin();
  const site = await getSiteContent();
  return NextResponse.json({ site });
}

export async function PUT(request: Request) {
  await requireAdmin();
  const currentSite = await getSiteContent();
  const patch = (await request.json()) as Partial<SiteContent>;
  const site = mergeSiteContent(currentSite, patch);
  try { await saveSiteContent(site); } catch (error) { return contentSaveError(error, request); }
  return NextResponse.json({ ok: true, site });
}
