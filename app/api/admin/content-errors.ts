import { NextResponse } from "next/server";
import { BilingualMigrationRequiredError } from "@/lib/cms";
import { localeCookieName, translate, type Locale } from "@/lib/i18n";

export function requestLocale(request: Request): Locale {
  const referer = request.headers.get("referer");
  if (referer) {
    try { return /^\/en(?:\/|$)/.test(new URL(referer).pathname) ? "en" : "zh"; } catch { /* Fall back to the language cookie. */ }
  }
  return request.headers.get("cookie")?.split(";").some((cookie) => cookie.trim() === `${localeCookieName}=en`) ? "en" : "zh";
}

export function contentSaveError(error: unknown, request: Request) {
  const locale = requestLocale(request);
  if (error instanceof BilingualMigrationRequiredError) {
    return NextResponse.json({
      code: "BILINGUAL_MIGRATION_REQUIRED",
      error: translate(locale,
        "请先在数据库执行 supabase/bilingual-content-migration.sql，再保存双语内容。当前内容未被修改。",
        "Apply supabase/bilingual-content-migration.sql to the database before saving bilingual content. Existing content has not been changed.")
    }, { status: 409 });
  }
  return NextResponse.json({
    code: "CMS_SAVE_FAILED",
    error: translate(locale, "保存失败，请检查数据库连接后重试。", "Saving failed. Check the database connection and try again.")
  }, { status: 500 });
}
