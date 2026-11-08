import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/en/admin", "/api/", "/cart", "/en/cart", "/search", "/en/search"] },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
