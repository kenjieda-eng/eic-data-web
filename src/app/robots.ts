import type { MetadataRoute } from "next";

const SITE_URL = "https://data.eic-jp.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // N9 (2026-05-17): /api/og/* は SEO 上必要 (Open Graph image を取得しに来る
        // Googlebot/Slackbot がブロックされないよう個別 allow)、それ以外の /api/* は
        // 引き続き crawl 対象外。
        allow: ["/", "/api/og/"],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
