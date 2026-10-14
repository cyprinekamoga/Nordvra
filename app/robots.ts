import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** /robots.txt: keep the admin and the secret quote links out of search engines. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/offert"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
