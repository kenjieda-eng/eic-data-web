/**
 * GET /feed.xml — Insight 新着の RSS 2.0 フィード
 *
 * INSIGHTS を updated 降順で上位 20 件配信する。XML 組み立て（エスケープ・
 * 件数上限・並び順）は純関数 buildRssXml 側にあり、src/lib/rss.test.ts で検証。
 * layout.tsx の alternates.types から <link rel="alternate"> で自動発見できる。
 */

import { INSIGHTS } from "@/lib/insights";
import { buildRssXml } from "@/lib/rss";

export const revalidate = 3600;

export async function GET() {
  return new Response(buildRssXml(INSIGHTS), {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
