"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localizePath } from "@/lib/i18n";
import { useLanguage } from "./LanguageProvider";

export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { locale } = useLanguage();
  const localized = typeof href === "string"
    ? localizePath(href, locale)
    : { ...href, pathname: href.pathname ? localizePath(href.pathname, locale) : href.pathname };
  return <Link {...props} href={localized} />;
}
