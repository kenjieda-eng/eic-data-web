/**
 * Insight ファセット (domain / renderer) 抽出ヘルパ — Phase C Day 1 で確立
 *
 * 既存 41 本の INSIGHTS 配列は `slug / title / lede / tags / sources / updated` のみ持ち、
 * 明示的な domain / renderer フィールドを持たない。新規 41 本に backfill すると
 * 大きな差分になるため、Phase C Day 1 では:
 *   - `getInsightDomain(insight)`: tags から主軸 domain を導出
 *   - `INSIGHT_RENDERER_MAP[slug]`: slug → primary renderer の静的マップ
 *   - `getInsightRenderer(slug)`: マップ参照、未定義は "ChartLine" にフォールバック
 * の 3 つを用意してファセットフィルタを成立させる。Phase C-Day-2 以降で
 * 必要に応じて INSIGHTS 配列自体に domain/renderer を持ち込む選択肢を残す。
 */

import { INSIGHTS, type Insight } from "./insights";
import { INSIGHT_DOMAINS, type InsightDomain, type InsightRenderer } from "./insight-validator";

// tag → domain の優先順マッピング (tag が複数該当する場合は先に出現したものを採用)
// 「金融」を最優先とすることで Phase B-A Day 13 で確立した 8 件の金融タグが
// すべて finance domain に集まるよう設計。
const TAG_TO_DOMAIN: ReadonlyArray<[string, InsightDomain]> = [
  ["金融", "finance"],
  ["燃料", "fuel"],
  ["気象", "weather"],
  ["電力", "power"],
];

/** Insight の主軸 domain を tags から導出 (該当なしは null) */
export function getInsightDomain(insight: Insight): InsightDomain | null {
  for (const [tag, domain] of TAG_TO_DOMAIN) {
    if (insight.tags.includes(tag)) return domain;
  }
  return null;
}

/** slug → primary renderer の静的マップ。MDX を grep して構築 (2026-05-12 時点 41 本) */
export const INSIGHT_RENDERER_MAP: Record<string, InsightRenderer> = {
  "temp-vs-price": "ChartLine",
  "temp-min-hokkaido-vs-price": "ChartLine",
  "temp-max-kyushu-vs-price": "ChartLine",
  "temp-max-tokyo-summer": "ChartLine",
  "temp-vs-price-tohoku": "ChartLine",
  "temp-vs-price-chubu": "ChartLine",
  "temp-vs-price-kansai": "ChartLine",
  "temp-vs-price-chugoku": "ChartLine",
  "temp-vs-price-shikoku": "ChartLine",
  "temp-vs-price-hokuriku": "ChartLine",
  "lng-vs-price-tokyo": "ChartDual",
  "lng-lag-vs-price-tokyo": "ChartLagBars",
  "brent-lag-vs-price-tokyo": "ChartLagBars",
  "ttf-lag-vs-lng-jp": "ChartLagBars",
  "fx-decomp-lng-jepx-tokyo": "ChartDecomp",
  "jgb-vs-yen-lng": "ChartDual",
  "precip-hokuriku-vs-price": "ChartLine",
  "precip-kyushu-vs-price": "ChartLine",
  "solar-vs-sunshine-tokyo": "ChartLine",
  "nuclear-vs-jepx-kansai": "ChartLine",
  "renewables-share-trend": "ChartLine",
  "thermal-vs-lng": "ChartLine",
  "demand-vs-temp": "ChartLine",
  "wind-vs-wind-hokkaido": "ChartLine",
  "wind-vs-wind-hokuriku": "ChartLine",
  "solar-sunshine-9-region-heatmap": "ChartHeatmap",
  "wind-9-region-heatmap": "ChartHeatmap",
  "snow-9-region-heatmap": "ChartHeatmap",
  "thermal-fuel-cost-decomp": "ChartDecomp",
  "precip-9-region-heatmap": "ChartHeatmap",
  "temp-9-region-heatmap": "ChartHeatmap",
  "multi-region-jepx-comparison": "ChartLine",
  "region-fuel-sensitivity": "ChartLine",
  "spread-us-jp-10y-vs-fx": "ChartSpread",
  "us-yield-curve-vs-jp-demand": "ChartSpread",
  "us-30y-vs-jgb-30y": "ChartSpread",
  "us-10y-vs-yen-lng": "ChartDual",
  "us-2y-vs-jepx-tokyo": "ChartDual",
  "us-cpi-vs-fx": "ChartLine",
  "fed-funds-vs-jepx-tokyo": "ChartLine",
  "us-industrial-vs-jp-demand": "ChartLagBars",
  "fuel-cost-decomp": "ChartDecomp",
  "us-employment-vs-fx-vs-jepx": "ChartLine",
  "us-unemployment-vs-jp-demand": "ChartLagBars",
  "us-food-cpi-vs-yen-lng": "ChartLine",
  "tankan-vs-industrial-vs-demand": "ChartLine",
  "geothermal-vs-volcanic-temp": "ChartLine",
  // eu-ets-vs-yen-lng は 2026-05-27 draft 退避 (catalog eu-ets-eua-monthly 未着地)
  "china-pmi-vs-lng-asia": "ChartLagBars",
  "ecb-rate-vs-eurusd-vs-usdjpy": "ChartLine",
  "china-pmi-vs-jp-demand": "ChartLagBars",
  "iron-ore-vs-thermal-power": "ChartDual",
  "hokkaido-heating-vs-snow": "ChartLine",
  "okinawa-island-power-structure": "ChartLine",
  "fx-resilience-by-region": "ChartHeatmap",
  "global-lng-price-comparison": "ChartLine",
  "japan-cpi-vs-yen-energy": "ChartLagBars",
  "japan-industrial-vs-power": "ChartLagBars",
  "fuel-chain-overview": "ChartLine",
  "fed-funds-vs-fx": "ChartLine",
  "capacity-market-5-year-trends": "ChartLine",
  "balancing-market-5-products-comparison": "ChartLine",
  "tertiary-balance-vs-jepx": "ChartLine",
  "capacity-market-area-vs-power-mix": "ChartLine",
  "balancing-source-type-comparison": "ChartLine",
  "ecb-fed-rate-diff-vs-eurusd": "ChartSpread",
  "world-power-co2-intensity": "ChartLine",
  "world-power-mix-compare": "ChartLine",
  "japan-power-mix-trend": "ChartLine",
  "jepx-tokyo-monthly-regression": "ChartLine",
  "holiday-power-pattern-jepx": "ChartLine",
  "forecast-error-baseline-jepx": "ChartLine",
  "population-decline-vs-power-demand": "ChartLine",
  "lcoe-vs-power-mix": "ChartLine",
  "eu-ets-vs-jp-gx": "ChartLine",
  "eu-ets-allocation-gap-by-country": "ChartLine",
  "jp-energy-import-sources": "ChartLine",
};

/** slug → renderer (静的マップ参照、未定義は ChartLine フォールバック) */
export function getInsightRenderer(slug: string): InsightRenderer {
  return INSIGHT_RENDERER_MAP[slug] ?? "ChartLine";
}

/** Insight 一覧のファセット集計 (UI のフィルタチップの件数表示用) */
export interface InsightFacets {
  domains: { value: InsightDomain | "all"; count: number }[];
  renderers: { value: InsightRenderer | "all"; count: number }[];
  tags: { value: string; count: number }[];
}

export function summarizeInsightFacets(insights: Insight[]): InsightFacets {
  const domainCounts = new Map<InsightDomain | "all", number>([
    ["all", insights.length],
  ]);
  const rendererCounts = new Map<InsightRenderer | "all", number>([
    ["all", insights.length],
  ]);
  const tagCounts = new Map<string, number>();
  for (const i of insights) {
    const d = getInsightDomain(i);
    if (d) domainCounts.set(d, (domainCounts.get(d) ?? 0) + 1);
    const r = getInsightRenderer(i.slug);
    rendererCounts.set(r, (rendererCounts.get(r) ?? 0) + 1);
    for (const t of i.tags) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const domains: { value: InsightDomain | "all"; count: number }[] = [
    { value: "all" as const, count: insights.length },
    ...INSIGHT_DOMAINS.map((d) => ({
      value: d,
      count: domainCounts.get(d) ?? 0,
    })),
  ].filter((d) => d.value === "all" || d.count > 0);
  const renderers: { value: InsightRenderer | "all"; count: number }[] = [
    { value: "all", count: insights.length },
  ];
  for (const [r, c] of rendererCounts) {
    if (r === "all") continue;
    renderers.push({ value: r, count: c });
  }
  return {
    domains,
    renderers,
    tags: [...tagCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/** /insight ?tag=... &domain=... &renderer=... のサーバ側フィルタ */
export interface InsightFilterOptions {
  tag?: string | null;
  domain?: InsightDomain | null;
  renderer?: InsightRenderer | null;
}

export function filterInsights(
  insights: Insight[] = INSIGHTS,
  options: InsightFilterOptions = {},
): Insight[] {
  const { tag, domain, renderer } = options;
  return insights.filter((i) => {
    if (tag && !i.tags.includes(tag)) return false;
    if (domain && getInsightDomain(i) !== domain) return false;
    if (renderer && getInsightRenderer(i.slug) !== renderer) return false;
    return true;
  });
}

/** 前後 Insight ナビ用: INSIGHTS 配列内での前後 slug を取得 */
export interface InsightNeighbors {
  prev: Insight | null;
  next: Insight | null;
}

export function getInsightNeighbors(
  slug: string,
  insights: Insight[] = INSIGHTS,
): InsightNeighbors {
  const idx = insights.findIndex((i) => i.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? insights[idx - 1] : null,
    next: idx < insights.length - 1 ? insights[idx + 1] : null,
  };
}
