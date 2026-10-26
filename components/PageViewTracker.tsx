"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { stripLocale } from "@/lib/i18n";

export function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef("");

  useEffect(() => {
    const publicPath = stripLocale(pathname || "");
    if (!publicPath || publicPath.startsWith("/admin") || publicPath.startsWith("/api") || lastTrackedPath.current === publicPath) return;
    lastTrackedPath.current = publicPath;

    void fetch("/api/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: publicPath }),
      keepalive: true
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
