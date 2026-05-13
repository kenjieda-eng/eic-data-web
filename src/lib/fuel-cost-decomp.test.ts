import { describe, expect, test } from "vitest";
import { groupInsights } from "./grouping";
import { INSIGHT_RENDERER_MAP, getInsightDomain, getInsightRenderer } from "./insight-facets";
import { INSIGHTS, searchInsights } from "./insights";

const SLUG = "fuel-cost-decomp";

describe("Week 1 Day 3: Insight #42 fuel-cost-decomp 登録", () => {
  test("INSIGHTS 配列に fuel-cost-decomp が登録され、INSIGHT_RENDERER_MAP と整合", () => {
    const insight = INSIGHTS.find((i) => i.slug === SLUG);
    expect(insight).toBeDefined();
    expect(insight?.title).toContain("燃料コスト分解パネル");
    expect(insight?.updated).toBe("2026-05-13");
    expect(INSIGHT_RENDERER_MAP[SLUG]).toBe("ChartDecomp");
  });

  test("fuel-cost-decomp の tags は 燃料 / 為替 / 電力 を含む (3 ドメイン横断)", () => {
    const insight = INSIGHTS.find((i) => i.slug === SLUG)!;
    expect(insight.tags).toContain("燃料");
    expect(insight.tags).toContain("為替");
    expect(insight.tags).toContain("電力");
    expect(insight.tags).toContain("LNG");
    expect(insight.tags).toContain("要因分解");
  });

  test("fuel-cost-decomp の domain は fuel (TAG_TO_DOMAIN: 金融 > 燃料 > 気象 > 電力 で 燃料 が先勝ち)", () => {
    const insight = INSIGHTS.find((i) => i.slug === SLUG)!;
    expect(getInsightDomain(insight)).toBe("fuel");
  });

  test("fuel-cost-decomp の renderer は ChartDecomp (Insight #13 と同パターン、加法 3 要因分解)", () => {
    expect(getInsightRenderer(SLUG)).toBe("ChartDecomp");
  });

  test("fuel-cost-decomp は fuel-finance グループに分類され unclassified に落ちない", () => {
    const { groups, unclassified } = groupInsights(INSIGHTS);
    const fuelGroup = groups.find((g) => g.group.id === "fuel-finance")!;
    const slugs = fuelGroup.insights.map((i) => i.slug);
    expect(slugs).toContain(SLUG);
    expect(unclassified.map((i) => i.slug)).not.toContain(SLUG);
  });

  test("fuel-cost-decomp の sources は World Bank Pink Sheet + 日本銀行 + JEPX の 3 出典", () => {
    const insight = INSIGHTS.find((i) => i.slug === SLUG)!;
    expect(insight.sources).toHaveLength(3);
    expect(insight.sources).toContain("World Bank Pink Sheet");
    expect(insight.sources).toContain("日本銀行");
    expect(insight.sources).toContain("JEPX スポット市場");
  });

  test("searchInsights: '燃料コスト分解' で fuel-cost-decomp が検索でヒット", () => {
    const r = searchInsights(INSIGHTS, "燃料コスト分解");
    expect(r.some((i) => i.slug === SLUG)).toBe(true);
  });

  test("searchInsights: '4 層' (title 内) で fuel-cost-decomp が検索でヒット", () => {
    const r = searchInsights(INSIGHTS, "4 層");
    expect(r.some((i) => i.slug === SLUG)).toBe(true);
  });
});
