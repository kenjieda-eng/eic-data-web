import { INSIGHTS, type Insight } from "@/lib/insights";
import type { GlossaryTerm } from "./data";

const KEYWORD_OVERRIDES: Record<string, string[]> = {
  "jepx-spot": ["JEPX", "卸電力", "スポット"],
  "lng-jkm": ["LNG", "JKM"],
  fit: ["FIT", "FIP", "再エネ"],
  "gx-ets": ["GX-ETS", "排出量"],
  "peak-demand": ["ピーク", "需要"],
  capacity: ["容量"],
  imbalance: ["インバランス"],
  scope123: ["Scope"],
  wacc: ["WACC"],
  eua: ["EUA", "EU-ETS"],
  baseload: ["ベースロード", "原発", "原子力"],
  "fuel-adj": ["燃料費調整", "小売料金"],
  "fuel-shock": ["燃料コスト", "LNG", "原油"],
  "cutout-wind": ["風力", "風速"],
  "pumped-hydro": ["揚水", "水力"],
  "grid-constraint": ["系統", "連系線"],
  curtailment: ["出力制御", "太陽光"],
  "cif-price": ["CIF", "LNG-CIF"],
  "yield-curve": ["イールドカーブ", "金利"],
  spread: ["スプレッド", "金利差", "USD/JPY"],
  "fed-funds-rate": ["FRB", "FF", "政策金利", "米 2y"],
  "treasury-bill": ["T-Bill", "Treasury", "米国財務省"],
  inversion: ["逆イールド", "金利逆転"],
  "nonfarm-payrolls": ["雇用統計", "NFP", "PAYEMS", "雇用者数"],
  "unemployment-rate": ["失業率", "UNRATE"],
  "core-cpi": ["コア CPI", "コアCPI", "コア", "CPI"],
  "headline-cpi": ["ヘッドライン CPI", "総合 CPI", "CPI"],
  "tankan-di": ["短観", "業況判断", "DI", "Tankan"],
  "food-cpi": ["食品 CPI", "食品", "CPIUFDSL"],
  "energy-cpi": ["エネルギー CPI", "エネルギー", "CPIENGSL"],
  "industrial-production": ["鉱工業生産", "INDPRO", "生産指数"],
  "business-sentiment": ["景況感", "業況", "設備投資"],
  "energy-inflation": ["エネルギーインフレ", "燃料インフレ", "物価"],
  "fuel-pass-through": ["燃料費調整", "パススルー", "電気料金", "ガス料金"],
  "demand-elasticity": ["弾力性", "需要応答", "電力需要"],
};

function termKeywords(term: GlossaryTerm): string[] {
  const overrides = KEYWORD_OVERRIDES[term.slug] ?? [];
  const fromName = term.name
    .split(/[\s/()（）]/u)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
  return Array.from(new Set([term.name, ...overrides, ...fromName]));
}

function insightHaystack(insight: Insight): string {
  return [insight.title, insight.lede, insight.tags.join(" "), insight.sources.join(" ")]
    .join(" ")
    .toLowerCase();
}

export function findRelatedInsights(
  term: GlossaryTerm,
  insights: Insight[] = INSIGHTS,
  limit = 6,
): Insight[] {
  const keywords = termKeywords(term).map((k) => k.toLowerCase());
  if (keywords.length === 0) return [];
  const scored = insights
    .map((insight) => {
      const hay = insightHaystack(insight);
      const score = keywords.reduce(
        (acc, kw) => (kw && hay.includes(kw) ? acc + 1 : acc),
        0,
      );
      return { insight, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.insight);
}
