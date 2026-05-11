"use client";

import { usePathname } from "next/navigation";
import { INSIGHTS } from "@/lib/insights";

const SITE_URL = "https://data.eic-jp.org";

/**
 * Insight Article 構造化データ (Phase C Day 4)
 *
 * Googlebot は client-side hydrate 後の JSON-LD を index する (Google 公式仕様)。
 * usePathname で /insight/<slug> を抽出 → INSIGHTS から Article schema を生成。
 * MDX 側で slug を渡す必要なし (DRY、InsightNav / InsightCitation と同じパターン)。
 */
export default function InsightStructuredData() {
  const pathname = usePathname();
  const slug = (pathname ?? "")
    .replace(/^\/insight\//, "")
    .replace(/\/$/, "");
  if (!slug) return null;
  const insight = INSIGHTS.find((i) => i.slug === slug);
  if (!insight) return null;

  const json = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: insight.title,
    description: insight.lede,
    datePublished: insight.updated,
    dateModified: insight.updated,
    author: {
      "@type": "Organization",
      name: "EIC Data 編集部",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "一般社団法人エネルギー情報センター",
      url: "https://eic-jp.org/",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/opengraph-image`,
      },
    },
    image: `${SITE_URL}/opengraph-image`,
    inLanguage: "ja",
    keywords: insight.tags.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/insight/${insight.slug}`,
    },
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
