"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getInsightNeighbors } from "@/lib/insight-facets";
import NewsletterSubscribeBox from "./NewsletterSubscribeBox";

/**
 * 前後 Insight ナビ (Phase C Day 1 で確立)
 *
 * mdx-components.tsx に登録され、各 Insight MDX の末尾で `<InsightNav />` を呼ぶことで
 * `usePathname()` から `/insight/<slug>` を抽出 → INSIGHTS 配列から前後を解決。
 * MDX 側で slug を渡す必要がない (DRY)。
 */
export default function InsightNav() {
  const pathname = usePathname();
  const slug = (pathname ?? "")
    .replace(/^\/insight\//, "")
    .replace(/\/$/, "");
  if (!slug) return null;
  const { prev, next } = getInsightNeighbors(slug);

  return (
    <>
    {(prev || next) && (
    <nav
      aria-label="前後 Insight ナビゲーション"
      className="mt-12 grid grid-cols-1 gap-3 border-t border-slate-200 pt-6 md:grid-cols-2"
    >
      {prev ? (
        <Link
          href={`/insight/${prev.slug}`}
          className="group rounded-md border border-slate-200 bg-white p-4 transition hover:border-emerald-500 hover:bg-emerald-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          <div className="text-xs uppercase tracking-wider text-faint">
            ← 前の Insight
          </div>
          <div className="mt-1 text-sm md:text-base font-semibold text-ink group-hover:text-emerald-800">
            {prev.title}
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/insight/${next.slug}`}
          className="group rounded-md border border-slate-200 bg-white p-4 text-right transition hover:border-emerald-500 hover:bg-emerald-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          <div className="text-xs uppercase tracking-wider text-faint">
            次の Insight →
          </div>
          <div className="mt-1 text-sm md:text-base font-semibold text-ink group-hover:text-emerald-800">
            {next.title}
          </div>
        </Link>
      ) : (
        <div />
      )}
    </nav>
    )}
    <NewsletterSubscribeBox
      utmSource="insight-footer"
      utmCampaign={`insight-${slug}`}
      heading="続報を週次で受け取る"
      subtext="EIC Data の Insight 新着 + JEPX 特異日 + 用語集新項目を、毎週土曜朝にお届けします。"
    />
    </>
  );
}
