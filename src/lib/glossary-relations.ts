/**
 * 用語集 23 項目の関連性データ (/glossary/graph 用)
 *
 * 各 from / to は src/app/glossary/data.ts の slug を参照。
 * weight は 0.0-1.0、グラフのエッジ太さに使用。
 *
 * カテゴリ別カラーは GLOSSARY_CATEGORY_COLORS で定義 (D3 force layout 凡例と共有)。
 */
import {
  GLOSSARY_CATEGORIES,
  GLOSSARY_TERMS,
  type GlossaryCategory,
  type GlossaryTerm,
} from "../app/glossary/data";

export interface GlossaryRelation {
  from: string;
  to: string;
  weight: number;
}

export const GLOSSARY_RELATIONS: GlossaryRelation[] = [
  // JEPX (basic) クラスタ — 卸電力市場の中心ハブ
  { from: "jepx-spot", to: "baseload", weight: 0.7 },
  { from: "jepx-spot", to: "capacity", weight: 0.6 },
  { from: "jepx-spot", to: "imbalance", weight: 0.7 },
  { from: "jepx-spot", to: "fuel-adj", weight: 0.7 },
  { from: "jepx-spot", to: "peak-demand", weight: 0.8 },
  { from: "jepx-spot", to: "curtailment", weight: 0.6 },

  // LNG / fuel クラスタ
  { from: "lng-jkm", to: "cif-price", weight: 0.9 },
  { from: "lng-jkm", to: "fuel-shock", weight: 0.9 },
  { from: "fuel-shock", to: "fuel-adj", weight: 0.9 },
  { from: "fuel-shock", to: "cif-price", weight: 0.8 },
  { from: "fuel-shock", to: "baseload", weight: 0.5 },
  { from: "cif-price", to: "fuel-adj", weight: 0.6 },

  // power クラスタ
  { from: "baseload", to: "peak-demand", weight: 0.7 },
  { from: "baseload", to: "pumped-hydro", weight: 0.6 },
  { from: "pumped-hydro", to: "peak-demand", weight: 0.7 },
  { from: "pumped-hydro", to: "curtailment", weight: 0.6 },
  { from: "pumped-hydro", to: "grid-constraint", weight: 0.5 },
  { from: "curtailment", to: "grid-constraint", weight: 0.9 },
  { from: "curtailment", to: "fit", weight: 0.7 },
  { from: "grid-constraint", to: "peak-demand", weight: 0.5 },
  { from: "cutout-wind", to: "grid-constraint", weight: 0.5 },
  { from: "cutout-wind", to: "curtailment", weight: 0.5 },

  // regulation クラスタ
  { from: "fit", to: "gx-ets", weight: 0.5 },
  { from: "gx-ets", to: "scope123", weight: 0.7 },
  { from: "gx-ets", to: "eua", weight: 0.9 },
  { from: "eua", to: "scope123", weight: 0.6 },
  { from: "capacity", to: "peak-demand", weight: 0.7 },
  { from: "capacity", to: "baseload", weight: 0.6 },
  { from: "imbalance", to: "curtailment", weight: 0.5 },

  // finance クラスタ (Phase 3 米金利 + マクロ)
  { from: "yield-curve", to: "treasury-bill", weight: 0.9 },
  { from: "yield-curve", to: "inversion", weight: 0.9 },
  { from: "yield-curve", to: "spread", weight: 0.8 },
  { from: "spread", to: "fed-funds-rate", weight: 0.7 },
  { from: "spread", to: "treasury-bill", weight: 0.7 },
  { from: "fed-funds-rate", to: "treasury-bill", weight: 0.8 },
  { from: "fed-funds-rate", to: "inversion", weight: 0.8 },
  { from: "inversion", to: "treasury-bill", weight: 0.7 },
  { from: "wacc", to: "fed-funds-rate", weight: 0.5 },
  { from: "wacc", to: "yield-curve", weight: 0.5 },

  // 横断ブリッジ (北極星「エネルギーと金融の引用インフラ」の象徴)
  { from: "fuel-shock", to: "wacc", weight: 0.4 },
  { from: "fed-funds-rate", to: "fuel-shock", weight: 0.4 },
  { from: "yield-curve", to: "peak-demand", weight: 0.4 },
  { from: "scope123", to: "baseload", weight: 0.5 },
];

export const GLOSSARY_CATEGORY_COLORS: Record<GlossaryCategory, string> = {
  basic: "#0ea5e9", // sky-500
  regulation: "#8b5cf6", // violet-500
  power: "#10b981", // emerald-500
  fuel: "#f97316", // orange-500
  finance: "#eab308", // yellow-500
};

export interface GlossaryNode {
  slug: string;
  name: string;
  category: GlossaryCategory;
  categoryLabel: string;
  description: string;
  /** 接続エッジ数 (degree) — ノード半径に使用 */
  degree: number;
}

export interface GlossaryEdge {
  source: string;
  target: string;
  weight: number;
}

export interface GlossaryGraph {
  nodes: GlossaryNode[];
  edges: GlossaryEdge[];
}

export function buildGlossaryGraph(
  terms: GlossaryTerm[] = GLOSSARY_TERMS,
  relations: GlossaryRelation[] = GLOSSARY_RELATIONS,
): GlossaryGraph {
  const validSlugs = new Set(terms.map((t) => t.slug));
  const filteredEdges = relations.filter(
    (r) => validSlugs.has(r.from) && validSlugs.has(r.to) && r.from !== r.to,
  );

  const degreeMap = new Map<string, number>();
  for (const r of filteredEdges) {
    degreeMap.set(r.from, (degreeMap.get(r.from) ?? 0) + 1);
    degreeMap.set(r.to, (degreeMap.get(r.to) ?? 0) + 1);
  }

  const nodes: GlossaryNode[] = terms.map((t) => ({
    slug: t.slug,
    name: t.name,
    category: t.category,
    categoryLabel: GLOSSARY_CATEGORIES[t.category],
    description: t.description,
    degree: degreeMap.get(t.slug) ?? 0,
  }));

  const edges: GlossaryEdge[] = filteredEdges.map((r) => ({
    source: r.from,
    target: r.to,
    weight: r.weight,
  }));

  return { nodes, edges };
}

/**
 * 半径計算: degree 0 → 8px, degree max → 20px
 * (D3 SVG circle.r に使用、ノードクリック当たり判定にも)
 */
export function nodeRadius(degree: number, maxDegree: number): number {
  const MIN = 8;
  const MAX = 20;
  if (maxDegree <= 0) return MIN;
  return MIN + ((MAX - MIN) * degree) / maxDegree;
}

/** エッジ太さ: weight 0 → 0.5px, weight 1 → 3px */
export function edgeWidth(weight: number): number {
  const clamped = Math.max(0, Math.min(1, weight));
  return 0.5 + 2.5 * clamped;
}
