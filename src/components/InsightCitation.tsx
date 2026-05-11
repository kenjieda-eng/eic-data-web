"use client";

import { usePathname } from "next/navigation";
import { INSIGHTS } from "@/lib/insights";
import CitationButton from "./CitationButton";

/**
 * Insight 詳細ページ末尾用の引用ボタン (Phase C Day 3 で確立)
 *
 * `usePathname()` から `/insight/<slug>` を抽出 → INSIGHTS 配列から
 * title / lede を取得 → CitationButton に引き渡す。MDX 側で slug を
 * 渡す必要がない (DRY、InsightNav と同じパターン)。
 */
export default function InsightCitation() {
  const pathname = usePathname();
  const slug = (pathname ?? "")
    .replace(/^\/insight\//, "")
    .replace(/\/$/, "");
  if (!slug) return null;
  const insight = INSIGHTS.find((i) => i.slug === slug);
  if (!insight) return null;

  return (
    <div className="mt-10">
      <CitationButton
        citation={{
          slug: insight.slug,
          title: insight.title,
          kind: "insight",
        }}
      />
    </div>
  );
}
