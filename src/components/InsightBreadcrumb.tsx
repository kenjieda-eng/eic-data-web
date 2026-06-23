"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { extractInsightSlug, getInsightBySlug } from "@/lib/insights";

const SITE_URL = "https://data.eic-jp.org";

/**
 * Insight 記事パンくず + BreadcrumbList 構造化データ (SEO T2-2)
 *
 * InsightNav / InsightStructuredData と同じ DRY パターン: usePathname() から
 * `/insight/<slug>` を抽出し INSIGHTS から記事を解決する。MDX 側は何も渡さない。
 * 記事ページ (slug が INSIGHTS に存在) のみ描画し、一覧 (/insight) や
 * サブページ (/insight/map・/insight/network) では getInsightBySlug が
 * undefined を返すため null となり、何も出さない。
 */
export default function InsightBreadcrumb() {
  const pathname = usePathname();
  const slug = extractInsightSlug(pathname);
  if (!slug) return null;
  const insight = getInsightBySlug(slug);
  if (!insight) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ホーム",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "インサイト",
        item: `${SITE_URL}/insight`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: insight.title,
        item: `${SITE_URL}/insight/${insight.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto px-4 pt-6 max-w-3xl md:max-w-5xl lg:max-w-6xl">
      <nav aria-label="breadcrumb" className="text-xs text-faint">
        <Link href="/" className="hover:text-emerald-700">
          ホーム
        </Link>
        <span aria-hidden className="mx-1.5">
          ／
        </span>
        <Link href="/insight" className="hover:text-emerald-700">
          インサイト
        </Link>
        <span aria-hidden className="mx-1.5">
          ／
        </span>
        <span aria-current="page">{insight.title}</span>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
