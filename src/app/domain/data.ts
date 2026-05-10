import { INSIGHTS, type Insight } from "../../lib/insights";

export interface DomainSubcategory {
  name: string;
  description: string;
  matcher: (id: string) => boolean;
}

export interface DomainPageMeta {
  id: string;
  name: string;
  emoji: string;
  description: string;
  insightKeywords: string[];
  subcategories: DomainSubcategory[];
}

export const DOMAINS_DAY6: DomainPageMeta[] = [
  {
    id: "power",
    name: "電力",
    emoji: "⚡",
    description:
      "JEPX 卸電力価格 9 エリア + システムプライス 1 と、METI 電力調査統計の電源別 8 系列・販売電力量 3 系列・派生 1 を扱うドメイン。気象（気温・降水量・日照）と燃料（LNG・原油）の両方から影響を受け、Insight 群の中核を構成する。再エネ比率や原発再稼働の進捗もここで追える。",
    insightKeywords: ["電力", "原発", "再エネ", "太陽光", "風力", "水力", "火力", "需要", "JEPX"],
    subcategories: [
      {
        name: "JEPX 9 エリア + システム",
        description: "卸電力価格の地域別 + 全国システム値",
        matcher: (id) => id.startsWith("jepx-spot"),
      },
      {
        name: "METI 電源別発電量",
        description: "火力 / 水力 / 原子力 / 太陽光 / 風力 / 地熱 / バイオマス / 総発電",
        matcher: (id) => id.startsWith("meti-gen-"),
      },
      {
        name: "METI 販売電力量",
        description: "電灯 / 電力 / 合計の月次需要",
        matcher: (id) => id.startsWith("meti-demand-"),
      },
      {
        name: "派生・比率指標",
        description: "再エネ比率など派生系列",
        matcher: (id) => id.includes("renewables-share"),
      },
    ],
  },
  {
    id: "weather",
    name: "気象",
    emoji: "🌤️",
    description:
      "気象庁の 9 地点（札幌・仙台・東京・名古屋・金沢・大阪・広島・高松・福岡）について、気温・降水量・日照時間・風速・最深積雪の 5 変数を月次で揃えた catalog 最大規模ドメイン。電力需要や再エネ出力との相関分析の土台となり、Insight #1〜#10 の地域別気温 × JEPX シリーズと #19〜#21 のヒートマップ群を支える。",
    insightKeywords: ["気象", "気温", "降水量", "日照", "風速", "雪", "豪雪"],
    subcategories: [
      {
        name: "気温（9 地点 + 全国平均）",
        description: "JMA 日平均気温の月次集約",
        matcher: (id) => id.startsWith("temp-") || id === "temp-avg",
      },
      {
        name: "降水量（9 地点）",
        description: "JMA 日次降水量の月次集約",
        matcher: (id) => id.startsWith("precip-"),
      },
      {
        name: "日照時間（9 地点）",
        description: "太陽光発電ポテンシャルの裏側指標",
        matcher: (id) => id.startsWith("sunshine-"),
      },
      {
        name: "風速（9 地点）",
        description: "陸上風力ポテンシャルの裏側指標",
        matcher: (id) => id.startsWith("wind-"),
      },
      {
        name: "最深積雪（9 地点）",
        description: "暖房需要 + 融雪需要 + 水力ベースロードの先行指標",
        matcher: (id) => id.startsWith("snow-"),
      },
    ],
  },
  {
    id: "fuel",
    name: "燃料",
    emoji: "🔥",
    description:
      "World Bank Pink Sheet を一次出典とする LNG（JKM / 日本 CIF / Henry Hub / TTF）と原油（Brent / Dubai / WTI）、石炭（豪州 Newcastle）の月次価格。電力ドメインとの 2 軸時系列・ラグ相関・要因分解の起点となり、Insight #11〜#15 の燃料伝播シリーズで主役を務める。すべて月次・public-domain 系列。",
    insightKeywords: ["燃料", "LNG", "原油", "TTF", "石炭"],
    subcategories: [
      {
        name: "LNG（4 系列）",
        description: "JKM / 日本 CIF / Henry Hub / TTF",
        matcher: (id) => id.includes("lng") || id.includes("ng-"),
      },
      {
        name: "原油（3 系列）",
        description: "Brent / Dubai / WTI",
        matcher: (id) => id.includes("crude"),
      },
      {
        name: "石炭",
        description: "Newcastle 指標（豪州）",
        matcher: (id) => id.includes("coal"),
      },
    ],
  },
];

export function getDomainById(id: string): DomainPageMeta | undefined {
  return DOMAINS_DAY6.find((d) => d.id === id);
}

export function findRelatedInsightsForDomain(
  meta: DomainPageMeta,
  insights: Insight[] = INSIGHTS,
  limit = 12,
): Insight[] {
  const keywords = meta.insightKeywords.map((k) => k.toLowerCase());
  if (keywords.length === 0) return [];
  const scored = insights
    .map((insight) => {
      const haystack = [
        insight.title,
        insight.lede,
        insight.tags.join(" "),
        insight.sources.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const score = keywords.reduce(
        (acc, kw) => (kw && haystack.includes(kw) ? acc + 1 : acc),
        0,
      );
      return { insight, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.insight);
}

export function groupIndicatorsBySubcategory<T extends { id: string }>(
  meta: DomainPageMeta,
  rows: T[],
): { sub: DomainSubcategory; rows: T[] }[] {
  const used = new Set<string>();
  const groups = meta.subcategories.map((sub) => {
    const matched = rows.filter((r) => {
      if (used.has(r.id)) return false;
      if (sub.matcher(r.id)) {
        used.add(r.id);
        return true;
      }
      return false;
    });
    return { sub, rows: matched };
  });
  return groups.filter((g) => g.rows.length > 0);
}
