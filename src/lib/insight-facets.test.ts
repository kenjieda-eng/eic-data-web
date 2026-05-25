import { describe, expect, test } from "vitest";
import { INSIGHTS } from "./insights";
import {
  filterInsights,
  getInsightDomain,
  getInsightNeighbors,
  getInsightRenderer,
  INSIGHT_RENDERER_MAP,
  summarizeInsightFacets,
} from "./insight-facets";

describe("Phase C Day 1: insight-facets", () => {
  test("getInsightDomain: 「金融」タグ → finance", () => {
    const fin = INSIGHTS.find((i) => i.slug === "jgb-vs-yen-lng")!;
    expect(getInsightDomain(fin)).toBe("finance");
  });

  test("getInsightDomain: 「気象」 + 「電力」両タグ → finance より下、金融優先で電力ではなく weather/power の優先順", () => {
    const energy = INSIGHTS.find((i) => i.slug === "temp-vs-price")!;
    expect(["weather", "power"]).toContain(getInsightDomain(energy));
  });

  test("INSIGHT_RENDERER_MAP: 65 本全 slug がマップに含まれる (5/25 で #65 balancing-source-type-comparison を追加 = 電源種別別 Insight)", () => {
    const mappedSlugs = new Set(Object.keys(INSIGHT_RENDERER_MAP));
    const insightsSlugs = new Set(INSIGHTS.map((i) => i.slug));
    for (const slug of insightsSlugs) {
      expect(mappedSlugs.has(slug), `slug ${slug} は map に未登録`).toBe(true);
    }
    expect(INSIGHTS.length).toBe(65);
    expect(Object.keys(INSIGHT_RENDERER_MAP)).toHaveLength(65);
  });

  test("getInsightRenderer: 各 slug に正しい renderer を返す", () => {
    expect(getInsightRenderer("temp-vs-price")).toBe("ChartLine");
    expect(getInsightRenderer("lng-vs-price-tokyo")).toBe("ChartDual");
    expect(getInsightRenderer("brent-lag-vs-price-tokyo")).toBe("ChartLagBars");
    expect(getInsightRenderer("fx-decomp-lng-jepx-tokyo")).toBe("ChartDecomp");
    expect(getInsightRenderer("temp-9-region-heatmap")).toBe("ChartHeatmap");
    expect(getInsightRenderer("spread-us-jp-10y-vs-fx")).toBe("ChartSpread");
  });

  test("filterInsights: tag=「金融」で 18 件 (5/18 朝 #60 fed-funds-vs-fx 追加で +1)", () => {
    const filtered = filterInsights(INSIGHTS, { tag: "金融" });
    expect(filtered.length).toBe(18);
    const slugs = filtered.map((i) => i.slug);
    expect(slugs).toContain("jgb-vs-yen-lng");
    expect(slugs).toContain("us-cpi-vs-fx");
    expect(slugs).toContain("fed-funds-vs-jepx-tokyo");
    expect(slugs).toContain("fed-funds-vs-fx");
  });

  test("filterInsights: domain=finance で 18 件 (金融タグ含む = finance domain 導出)", () => {
    const filtered = filterInsights(INSIGHTS, { domain: "finance" });
    expect(filtered.length).toBe(18);
  });

  test("filterInsights: renderer=ChartHeatmap で 9 地点ヒートマップ 5 本 + Day 5 午後第 3 弾の #55 fx-resilience-by-region で 6 本", () => {
    const filtered = filterInsights(INSIGHTS, { renderer: "ChartHeatmap" });
    expect(filtered.length).toBe(6);
    const slugs = filtered.map((i) => i.slug).sort();
    expect(slugs).toEqual([
      "fx-resilience-by-region",
      "precip-9-region-heatmap",
      "snow-9-region-heatmap",
      "solar-sunshine-9-region-heatmap",
      "temp-9-region-heatmap",
      "wind-9-region-heatmap",
    ]);
  });

  test("filterInsights: tag=「金融」 + renderer=ChartSpread の AND 検索で 3 本 (スプレッド 3 本すべて金融タグ)", () => {
    const filtered = filterInsights(INSIGHTS, {
      tag: "金融",
      renderer: "ChartSpread",
    });
    expect(filtered.length).toBe(3);
    const slugs = filtered.map((i) => i.slug).sort();
    expect(slugs).toEqual([
      "spread-us-jp-10y-vs-fx",
      "us-30y-vs-jgb-30y",
      "us-yield-curve-vs-jp-demand",
    ]);
  });

  test("summarizeInsightFacets: domains には all + 出現 domain のみ、count 整合", () => {
    const facets = summarizeInsightFacets(INSIGHTS);
    const all = facets.domains.find((d) => d.value === "all");
    expect(all?.count).toBe(65);
    const finance = facets.domains.find((d) => d.value === "finance");
    expect(finance?.count).toBe(18);
  });

  test("getInsightNeighbors: 中間 slug は prev + next 両方存在、両端は片側 null", () => {
    const first = getInsightNeighbors(INSIGHTS[0].slug);
    expect(first.prev).toBeNull();
    expect(first.next?.slug).toBe(INSIGHTS[1].slug);
    const last = getInsightNeighbors(INSIGHTS[INSIGHTS.length - 1].slug);
    expect(last.prev?.slug).toBe(INSIGHTS[INSIGHTS.length - 2].slug);
    expect(last.next).toBeNull();
    const mid = getInsightNeighbors(INSIGHTS[5].slug);
    expect(mid.prev?.slug).toBe(INSIGHTS[4].slug);
    expect(mid.next?.slug).toBe(INSIGHTS[6].slug);
  });

  test("getInsightNeighbors: 未知 slug は両方 null", () => {
    const result = getInsightNeighbors("non-existent-slug");
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });
});
