/**
 * 用語集 35 項目の関連性データ (/glossary/graph 用)
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

  // ===== Day 4 拡張 (+36 エッジ) =====
  // 米雇用統計クラスタ (NFP / UR / FFR / IP)
  { from: "nonfarm-payrolls", to: "unemployment-rate", weight: 0.95 },
  { from: "nonfarm-payrolls", to: "fed-funds-rate", weight: 0.85 },
  { from: "unemployment-rate", to: "fed-funds-rate", weight: 0.85 },
  { from: "nonfarm-payrolls", to: "industrial-production", weight: 0.7 },
  { from: "unemployment-rate", to: "industrial-production", weight: 0.6 },

  // CPI 内部関係 (core / headline / food / energy)
  { from: "core-cpi", to: "headline-cpi", weight: 0.95 },
  { from: "headline-cpi", to: "food-cpi", weight: 0.8 },
  { from: "headline-cpi", to: "energy-cpi", weight: 0.8 },
  { from: "core-cpi", to: "food-cpi", weight: 0.6 },
  { from: "core-cpi", to: "energy-cpi", weight: 0.6 },
  { from: "fed-funds-rate", to: "headline-cpi", weight: 0.8 },
  { from: "fed-funds-rate", to: "core-cpi", weight: 0.85 },
  { from: "unemployment-rate", to: "core-cpi", weight: 0.5 },

  // 日銀短観 / 景況感 / 鉱工業生産 連鎖
  { from: "tankan-di", to: "business-sentiment", weight: 0.95 },
  { from: "tankan-di", to: "industrial-production", weight: 0.75 },
  { from: "tankan-di", to: "peak-demand", weight: 0.5 },
  { from: "business-sentiment", to: "industrial-production", weight: 0.75 },
  { from: "industrial-production", to: "peak-demand", weight: 0.7 },

  // エネルギー × 経済 (energy-inflation / fuel-pass-through)
  { from: "energy-inflation", to: "energy-cpi", weight: 0.95 },
  { from: "energy-inflation", to: "headline-cpi", weight: 0.8 },
  { from: "energy-inflation", to: "fuel-shock", weight: 0.85 },
  { from: "energy-inflation", to: "fuel-pass-through", weight: 0.7 },
  { from: "fuel-pass-through", to: "fuel-adj", weight: 0.9 },
  { from: "fuel-pass-through", to: "fuel-shock", weight: 0.75 },
  { from: "fuel-pass-through", to: "cif-price", weight: 0.7 },
  { from: "fuel-pass-through", to: "jepx-spot", weight: 0.6 },
  { from: "energy-cpi", to: "fuel-adj", weight: 0.7 },
  { from: "food-cpi", to: "energy-inflation", weight: 0.5 },

  // 需要弾力性 (demand-elasticity)
  { from: "demand-elasticity", to: "peak-demand", weight: 0.7 },
  { from: "demand-elasticity", to: "fuel-adj", weight: 0.6 },
  { from: "demand-elasticity", to: "business-sentiment", weight: 0.4 },

  // 横断ブリッジ (Day 4 追加分)
  { from: "fed-funds-rate", to: "energy-inflation", weight: 0.5 },
  { from: "inversion", to: "industrial-production", weight: 0.6 },
  { from: "spread", to: "industrial-production", weight: 0.4 },
  { from: "nonfarm-payrolls", to: "headline-cpi", weight: 0.5 },
  { from: "industrial-production", to: "jepx-spot", weight: 0.5 },

  // ===== Day 5 午後タスク 2 拡張 (+20 エッジ、79 → 99) =====
  // 国際クラスタ (新カテゴリ international 4 項目 + 既存接続、+10 エッジ)
  { from: "eu-ets", to: "yen-denominated-cost", weight: 0.85 },
  { from: "yen-denominated-cost", to: "jepx-spot", weight: 0.7 },
  { from: "china-pmi", to: "lng-jkm", weight: 0.7 },
  { from: "lng-jkm", to: "yen-denominated-cost", weight: 0.8 },
  { from: "ecb-deposit-rate", to: "fed-funds-rate", weight: 0.7 },
  { from: "ecb-deposit-rate", to: "fed-funds-rate-jp-spillover", weight: 0.6 },
  { from: "fed-funds-rate-jp-spillover", to: "fed-funds-rate", weight: 0.95 },
  { from: "fed-funds-rate-jp-spillover", to: "yen-denominated-cost", weight: 0.8 },
  { from: "international-spillover", to: "yen-denominated-cost", weight: 0.85 },
  { from: "international-spillover", to: "fed-funds-rate-jp-spillover", weight: 0.85 },

  // 電力クラスタ拡張 (連系線/太陽光余剰/カーテイルメント、+5 エッジ)
  { from: "transmission-line-constraint", to: "grid-constraint", weight: 0.9 },
  { from: "transmission-line-constraint", to: "solar-surplus", weight: 0.85 },
  { from: "solar-surplus", to: "solar-curtailment", weight: 0.9 },
  { from: "solar-surplus", to: "curtailment", weight: 0.85 },
  { from: "transmission-line-constraint", to: "jepx-spot", weight: 0.7 },

  // 経済 × エネルギークラスタ拡張 (carbon-pricing/yen-denominated-cost、+5 エッジ)
  { from: "carbon-pricing", to: "energy-inflation", weight: 0.7 },
  { from: "carbon-pricing", to: "eu-ets", weight: 0.9 },
  { from: "carbon-pricing", to: "fuel-pass-through", weight: 0.6 },
  { from: "yen-denominated-cost", to: "fuel-pass-through", weight: 0.85 },
  { from: "yen-denominated-cost", to: "energy-inflation", weight: 0.7 },

  // ===== Day 6 PM (2026-05-17) international +5 項目に伴う +10 エッジ (99 → 109) =====
  // fed-dot-plot (FRB 政策ガイダンス) クラスタ
  { from: "fed-dot-plot", to: "fed-funds-rate", weight: 0.95 },
  { from: "fed-dot-plot", to: "fed-funds-rate-jp-spillover", weight: 0.75 },
  // core-pce (FRB 最重視インフレ指標) クラスタ
  { from: "core-pce", to: "fed-funds-rate", weight: 0.9 },
  { from: "core-pce", to: "core-cpi", weight: 0.85 },
  // yield-curve-inversion (景気後退シグナル、既存 inversion とは別文脈)
  { from: "yield-curve-inversion", to: "yield-curve", weight: 0.95 },
  { from: "yield-curve-inversion", to: "industrial-production", weight: 0.6 },
  // cbam (EU 国境炭素調整、EU ETS と密接)
  { from: "cbam", to: "eu-ets", weight: 0.95 },
  { from: "cbam", to: "carbon-pricing", weight: 0.85 },
  // lng-spot-vs-contract (日本 LNG 調達構造)
  { from: "lng-spot-vs-contract", to: "lng-jkm", weight: 0.95 },
  { from: "lng-spot-vs-contract", to: "fuel-shock", weight: 0.7 },

  // ===== Phase D (2026-05-21) Insight #61 連動 +3 用語 (capacity-market / occto / main-auction) に伴う +10 エッジ (109 → 119) =====
  // capacity-market クラスタ (詳細版容量市場、既存 capacity の詳細展開)
  { from: "capacity-market", to: "occto", weight: 0.95 },
  { from: "capacity-market", to: "main-auction", weight: 0.95 },
  { from: "capacity-market", to: "capacity", weight: 0.95 },
  { from: "capacity-market", to: "peak-demand", weight: 0.7 },
  { from: "capacity-market", to: "baseload", weight: 0.6 },
  // occto クラスタ (容量市場・需給調整市場・系統運用の中核組織)
  { from: "occto", to: "main-auction", weight: 0.85 },
  { from: "occto", to: "imbalance", weight: 0.7 },
  { from: "occto", to: "grid-constraint", weight: 0.6 },
  { from: "occto", to: "jepx-spot", weight: 0.55 },
  // main-auction クラスタ (容量市場の中核プロセス)
  { from: "main-auction", to: "peak-demand", weight: 0.75 },

  // ===== Phase D (2026-05-22) Insight #61 連動 容量市場関連 +2 用語 (capacity-payment / kw-value) に伴う +10 エッジ (119 → 129) =====
  // capacity-payment クラスタ (小売料金転嫁経路、容量市場の対価)
  { from: "capacity-payment", to: "capacity-market", weight: 0.95 },
  { from: "capacity-payment", to: "main-auction", weight: 0.85 },
  { from: "capacity-payment", to: "fuel-adj", weight: 0.8 },
  { from: "capacity-payment", to: "fuel-pass-through", weight: 0.7 },
  // kw-value クラスタ (kWh 価値との対概念、容量市場の取引対象)
  { from: "kw-value", to: "capacity-market", weight: 0.95 },
  { from: "kw-value", to: "capacity", weight: 0.85 },
  { from: "kw-value", to: "main-auction", weight: 0.85 },
  { from: "kw-value", to: "jepx-spot", weight: 0.75 },
  { from: "kw-value", to: "peak-demand", weight: 0.7 },
  { from: "kw-value", to: "capacity-payment", weight: 0.8 },

  // ===== Phase D (2026-05-23) D-018 需給調整市場 +3 用語 (balancing-market / tertiary-2 / freq-control) に伴う +9 エッジ (129 → 138) =====
  // balancing-market クラスタ (需給調整市場、日本電力 3 大市場の一角。jepx-spot には非接続で degree 12 維持)
  { from: "balancing-market", to: "occto", weight: 0.9 },
  { from: "balancing-market", to: "imbalance", weight: 0.85 },
  { from: "balancing-market", to: "capacity-market", weight: 0.6 },
  { from: "balancing-market", to: "kw-value", weight: 0.7 },
  { from: "balancing-market", to: "peak-demand", weight: 0.6 },
  // tertiary-2 クラスタ (三次調整力②、市場最古参商品。燃料・JEPX 連動を fuel-shock で表現)
  { from: "tertiary-2", to: "balancing-market", weight: 0.95 },
  { from: "tertiary-2", to: "fuel-shock", weight: 0.6 },
  // freq-control クラスタ (周波数制御、調整力の存在意義)
  { from: "freq-control", to: "balancing-market", weight: 0.85 },
  { from: "freq-control", to: "imbalance", weight: 0.6 },

  // ===== Phase 2 Ember 3部作 (#67/#68/#69) readability +6 用語に伴う +20 エッジ (138 → 158) =====
  // co2-intensity クラスタ (電力 CO2 強度、電源構成と炭素価格に橋)
  { from: "co2-intensity", to: "power-mix", weight: 0.9 },
  { from: "co2-intensity", to: "coal-phase-out", weight: 0.85 },
  { from: "co2-intensity", to: "eu-ets", weight: 0.6 },
  { from: "co2-intensity", to: "carbon-pricing", weight: 0.6 },
  // power-mix クラスタ (電源構成、CO2 強度・設備利用率・再エネのハブ)
  { from: "power-mix", to: "baseload", weight: 0.75 },
  { from: "power-mix", to: "capacity-factor", weight: 0.8 },
  { from: "power-mix", to: "renewables", weight: 0.85 },
  { from: "power-mix", to: "coal-phase-out", weight: 0.8 },
  // capacity-factor クラスタ (設備利用率、kW と kWh の非比例)
  { from: "capacity-factor", to: "baseload", weight: 0.7 },
  { from: "capacity-factor", to: "pumped-hydro", weight: 0.6 },
  { from: "capacity-factor", to: "curtailment", weight: 0.6 },
  // coal-phase-out クラスタ (脱石炭、炭素価格シグナルと日本制度)
  { from: "coal-phase-out", to: "eua", weight: 0.7 },
  { from: "coal-phase-out", to: "cbam", weight: 0.6 },
  { from: "coal-phase-out", to: "gx-ets", weight: 0.7 },
  // renewables クラスタ (再エネ、出力抑制と FIT)
  { from: "renewables", to: "curtailment", weight: 0.8 },
  { from: "renewables", to: "solar-curtailment", weight: 0.8 },
  { from: "renewables", to: "fit", weight: 0.85 },
  // yoy-same-month クラスタ (前年同月比、季節調整・前年比表示の指標群)
  { from: "yoy-same-month", to: "headline-cpi", weight: 0.7 },
  { from: "yoy-same-month", to: "core-cpi", weight: 0.7 },
  { from: "yoy-same-month", to: "industrial-production", weight: 0.6 },
  // EU ETS 方法論クラスタ（2026-06-02 +12）
  { from: "r-squared", to: "regression-coefficient", weight: 0.9 },
  { from: "r-squared", to: "persistence-forecast", weight: 0.5 },
  { from: "regression-coefficient", to: "load-forecast", weight: 0.6 },
  { from: "residual-demand", to: "load-forecast", weight: 0.8 },
  { from: "residual-demand", to: "peak-demand", weight: 0.7 },
  { from: "residual-demand", to: "curtailment", weight: 0.6 },
  { from: "persistence-forecast", to: "percentile-forecast", weight: 0.6 },
  { from: "percentile-forecast", to: "load-forecast", weight: 0.6 },
  { from: "load-forecast", to: "weather-vendor", weight: 0.7 },
  { from: "load-forecast", to: "peak-demand", weight: 0.7 },
  { from: "weather-vendor", to: "analogue-year", weight: 0.5 },
  { from: "analogue-year", to: "persistence-forecast", weight: 0.5 },
];

export const GLOSSARY_CATEGORY_COLORS: Record<GlossaryCategory, string> = {
  basic: "#0ea5e9", // sky-500
  regulation: "#8b5cf6", // violet-500
  power: "#10b981", // emerald-500
  fuel: "#f97316", // orange-500
  finance: "#eab308", // yellow-500
  economy: "#ec4899", // pink-500
  international: "#06b6d4", // cyan-500 (リン案 sky-500 は basic と被るため cyan-500 に変更)
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
