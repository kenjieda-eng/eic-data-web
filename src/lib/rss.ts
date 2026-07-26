/**
 * RSS 2.0 フィード生成（/feed.xml の中身）。
 *
 * ルートハンドラ（src/app/feed.xml/route.ts）から切り離した純関数群。
 * INSIGHTS を渡すと XML 文字列を返すだけなので、エスケープ・件数上限・
 * 並び順を vitest で直接検証できる（src/lib/rss.test.ts）。
 */

const SITE_URL = "https://data.eic-jp.org";

/** channel 要素の固定値（RSS リーダに表示される名前・説明）。 */
export const RSS_CHANNEL = {
  title: "EIC Data — Insight 新着",
  link: `${SITE_URL}/`,
  description:
    "日本のエネルギーと金融の公共データサイト。Insight（解説記事）の新着フィード",
  language: "ja",
} as const;

/** フィードに載せる最大件数（updated の新しい順に上位 N 件）。 */
export const RSS_ITEM_LIMIT = 20;

/** buildRssXml が必要とする Insight の最小形（Insight 型はこれを満たす）。 */
export interface RssSource {
  slug: string;
  title: string;
  lede: string;
  updated: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * XML テキストノード用のエスケープ。
 * タイトル・lede には「×」「&」「<」（例: t<2）が実際に含まれるため、
 * ここを通さないとフィードが XML として壊れる。& を最初に置換すること。
 */
export function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * `YYYY-MM-DD`（JST の日付）を RSS の pubDate（RFC 822）へ変換する。
 * 日付のみの updated は JST 0 時ちょうどとして扱い、+0900 を明示する。
 * 時刻付き ISO 文字列を渡した場合も JST の壁時計時刻に直して出力する。
 */
export function toRfc822Jst(updated: string): string {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(updated)
    ? `${updated}T00:00:00+09:00`
    : updated;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  // JST の壁時計時刻を UTC ゲッタで読み出す（+9h ずらしてから getUTC*）。
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = DAY_NAMES[jst.getUTCDay()];
  const month = MONTH_NAMES[jst.getUTCMonth()];
  const time = `${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}:${pad(jst.getUTCSeconds())}`;
  return `${day}, ${pad(jst.getUTCDate())} ${month} ${jst.getUTCFullYear()} ${time} +0900`;
}

/** Insight 1 件 → <item>。link と guid は同一 URL（isPermaLink=true）。 */
function buildItem(insight: RssSource): string {
  const link = `${SITE_URL}/insight/${insight.slug}`;
  return [
    "    <item>",
    `      <title>${escapeXml(insight.title)}</title>`,
    `      <link>${escapeXml(link)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
    `      <pubDate>${toRfc822Jst(insight.updated)}</pubDate>`,
    `      <description>${escapeXml(insight.lede)}</description>`,
    "    </item>",
  ].join("\n");
}

/**
 * RSS 2.0 の XML 文字列を組み立てる純関数。
 * updated 降順に並べ替え、上位 RSS_ITEM_LIMIT 件だけを item にする。
 */
export function buildRssXml(insights: readonly RssSource[]): string {
  const items = [...insights]
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, RSS_ITEM_LIMIT)
    .map(buildItem)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(RSS_CHANNEL.title)}</title>
    <link>${escapeXml(RSS_CHANNEL.link)}</link>
    <description>${escapeXml(RSS_CHANNEL.description)}</description>
    <language>${RSS_CHANNEL.language}</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
