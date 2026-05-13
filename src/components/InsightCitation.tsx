"use client";

import { usePathname } from "next/navigation";
import { INSIGHTS } from "@/lib/insights";
import CitationButton from "./CitationButton";
import UtterancesComments from "./UtterancesComments";

/**
 * Insight 詳細ページ末尾用の引用ボタン + リーダーコメント (Phase C Day 3 確立 / Day 6 拡張)
 *
 * `usePathname()` から `/insight/<slug>` を抽出 → INSIGHTS 配列から
 * title / lede を取得 → CitationButton に引き渡す。MDX 側で slug を
 * 渡す必要がない (DRY、InsightNav と同じパターン)。
 *
 * Day 6 (5/13) で UtterancesComments を併置: 全 42 Insight ページに自動配置
 * (42 MDX 編集ゼロ、本コンポーネント 1 箇所で完結)。
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
    <>
      <div className="mt-10">
        <CitationButton
          citation={{
            slug: insight.slug,
            title: insight.title,
            kind: "insight",
          }}
        />
      </div>
      <UtterancesComments />
    </>
  );
}
