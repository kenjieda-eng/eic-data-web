/**
 * Insight クロスリファレンスネットワーク (/insight/network) のグラフ構築
 *
 * 42 本の Insight 間の関連性を自動生成。エッジは以下 3 規則の max() で 1 本に統合:
 *   1. 共通タグ数 ≥ 2  → weight = 共通タグ数
 *   2. 共通 indicator ≥ 1 → weight = 共通 indicator 数 × 1.5
 *   3. 共通 region ≥ 1  → weight = 1.0
 *
 * カテゴリ別カラーは domain (power / weather / fuel / finance / other) に対応する 5 色
 * (/glossary/graph と同じパレットを再利用)。
 */
import { getInsightDomain } from "./insight-facets";
import type { InsightDomain } from "./insight-validator";
import { INSIGHTS, type Insight } from "./insights";

/** 9 エリア + 全国 (insight tags 内の地域ラベル) */
export const INSIGHT_REGIONS = [
  "東京",
  "北海道",
  "九州",
  "東北",
  "中部",
  "関西",
  "中国",
  "四国",
  "北陸",
  "全国",
] as const;
export type InsightRegion = (typeof INSIGHT_REGIONS)[number];
const REGION_SET = new Set<string>(INSIGHT_REGIONS as readonly string[]);

/**
 * 主要 indicator (tags 内のキー指標) — 重み × 1.5 で優先
 * 燃料・金融・電源構成・需要・為替/金利の代表ラベルを列挙
 */
export const INSIGHT_INDICATORS = [
  "LNG",
  "原油",
  "TTF",
  "USD/JPY",
  "JGB",
  "FRB",
  "CPI",
  "太陽光",
  "風力",
  "水力",
  "原発",
  "火力",
  "ベースロード",
  "需要",
  "為替",
  "金利",
  "鉱工業生産",
  "再エネ",
] as const;
export type InsightIndicator = (typeof INSIGHT_INDICATORS)[number];
const INDICATOR_SET = new Set<string>(INSIGHT_INDICATORS as readonly string[]);

/** Insight domain → 日本語ラベル */
export const INSIGHT_DOMAIN_LABEL_JA: Record<InsightDomain | "other", string> = {
  power: "電力",
  weather: "気象",
  fuel: "燃料",
  finance: "金融",
  esg: "ESG",
  technology: "技術",
  international: "国際",
  economy: "経済",
  policy: "制度",
  other: "その他",
};

/**
 * domain → 色。/glossary/graph の 5 色パレットを共有:
 *   weather=sky / power=emerald / fuel=orange / finance=yellow / other=violet
 * (基本/制度/電力/燃料/金融 と同じ系統色で統一感を保つ)
 */
export const INSIGHT_DOMAIN_COLORS: Record<InsightDomain | "other", string> = {
  weather: "#0ea5e9", // sky-500 (glossary: basic)
  power: "#10b981", // emerald-500 (glossary: power)
  fuel: "#f97316", // orange-500 (glossary: fuel)
  finance: "#eab308", // yellow-500 (glossary: finance)
  other: "#8b5cf6", // violet-500 (glossary: regulation)
  // 以下は INSIGHTS では未使用だが domain 完全型のため定義
  esg: "#8b5cf6",
  technology: "#8b5cf6",
  international: "#8b5cf6",
  economy: "#8b5cf6",
  policy: "#8b5cf6",
};

export type InsightEdgeKind = "tag" | "indicator" | "region";

export interface InsightGraphNode {
  slug: string;
  title: string;
  lede: string;
  tags: string[];
  domain: InsightDomain | "other";
  domainLabel: string;
  /** 接続エッジ数 (degree) — ノード半径に使用 */
  degree: number;
}

export interface InsightGraphEdge {
  source: string;
  target: string;
  weight: number;
  kind: InsightEdgeKind;
  sharedTags: string[];
}

export interface InsightGraph {
  nodes: InsightGraphNode[];
  edges: InsightGraphEdge[];
}

/**
 * 2 つの Insight からエッジを計算。3 規則の max() で 1 本に統合。
 * 該当なしの場合 null。
 */
export function computeInsightEdge(
  a: Insight,
  b: Insight,
): {
  weight: number;
  kind: InsightEdgeKind;
  sharedTags: string[];
} | null {
  if (a.slug === b.slug) return null;
  const tagsA = new Set(a.tags);
  const shared = b.tags.filter((t) => tagsA.has(t));
  if (shared.length === 0) return null;

  const sharedIndicators = shared.filter((t) => INDICATOR_SET.has(t));
  const sharedRegions = shared.filter((t) => REGION_SET.has(t));

  const wTag = shared.length >= 2 ? shared.length : 0;
  const wIndicator =
    sharedIndicators.length >= 1 ? sharedIndicators.length * 1.5 : 0;
  const wRegion = sharedRegions.length >= 1 ? 1.0 : 0;

  const max = Math.max(wTag, wIndicator, wRegion);
  if (max === 0) return null;

  // tie-break 優先順: indicator > tag > region (情報量の大きい順)
  let kind: InsightEdgeKind;
  if (wIndicator === max && wIndicator > 0) kind = "indicator";
  else if (wTag === max && wTag > 0) kind = "tag";
  else kind = "region";

  return { weight: max, kind, sharedTags: shared };
}

/** 42 本の Insight からグラフを構築 (SSG 時に Server Component で呼ばれる) */
export function buildInsightGraph(
  insights: Insight[] = INSIGHTS,
): InsightGraph {
  const edges: InsightGraphEdge[] = [];
  for (let i = 0; i < insights.length; i++) {
    for (let j = i + 1; j < insights.length; j++) {
      const e = computeInsightEdge(insights[i], insights[j]);
      if (e) {
        edges.push({
          source: insights[i].slug,
          target: insights[j].slug,
          weight: e.weight,
          kind: e.kind,
          sharedTags: e.sharedTags,
        });
      }
    }
  }

  const degreeMap = new Map<string, number>();
  for (const e of edges) {
    degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);
  }

  const nodes: InsightGraphNode[] = insights.map((i) => {
    const d = getInsightDomain(i) ?? "other";
    return {
      slug: i.slug,
      title: i.title,
      lede: i.lede,
      tags: i.tags,
      domain: d,
      domainLabel: INSIGHT_DOMAIN_LABEL_JA[d],
      degree: degreeMap.get(i.slug) ?? 0,
    };
  });

  return { nodes, edges };
}

/** ノード半径: degree 0 → 6px, degree max → 18px (glossary より小さめで密度に対応) */
export function insightNodeRadius(degree: number, maxDegree: number): number {
  const MIN = 6;
  const MAX = 18;
  if (maxDegree <= 0) return MIN;
  return MIN + ((MAX - MIN) * degree) / maxDegree;
}

/** エッジ太さ: 0 → 0.4px, max → 2.5px (エッジ多めなので細め) */
export function insightEdgeWidth(weight: number, maxWeight: number): number {
  const MIN = 0.4;
  const MAX = 2.5;
  if (maxWeight <= 0) return MIN;
  const clamped = Math.max(0, Math.min(maxWeight, weight));
  return MIN + ((MAX - MIN) * clamped) / maxWeight;
}
