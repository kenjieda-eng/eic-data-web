import { describe, expect, test } from "vitest";
import { getInsightsForSeries } from "./insight-series-map";
import { INSIGHTS } from "./insights";

const slugsFor = (seriesId: string) =>
  getInsightsForSeries(seriesId).map((r) => r.slug);

describe("catalog 逆引き: insight-series-map", () => {
  // 期待値は getInsightsForSeries の実出力で検証してから記載 (L-013)。
  // 将来 Insight 追加に強いよう「含む (toContain)」で判定する。

  test("ChartLine: edinet-kepco-net-income → power9-roa を含む", () => {
    expect(slugsFor("edinet-kepco-net-income")).toContain("power9-roa");
  });

  test("ChartDual(rightId 等): fuel-lng-jp-cif → 燃料系 Insight を複数含む", () => {
    const slugs = slugsFor("fuel-lng-jp-cif");
    expect(slugs).toContain("lng-vs-price-tokyo");
    expect(slugs).toContain("fuel-chain-overview");
    expect(slugs.length).toBeGreaterThanOrEqual(3);
  });

  test("ChartLine(leftId 等): jepx-spot-tokyo → JEPX 東京系 Insight を複数含む", () => {
    const slugs = slugsFor("jepx-spot-tokyo");
    expect(slugs).toContain("temp-vs-price");
    expect(slugs).toContain("lng-vs-price-tokyo");
    expect(slugs.length).toBeGreaterThanOrEqual(3);
  });

  test("ChartHeatmap(indicatorIds 配列): jma-sunshine-tokyo → ヒートマップ Insight を含む", () => {
    expect(slugsFor("jma-sunshine-tokyo")).toContain(
      "solar-sunshine-9-region-heatmap",
    );
  });

  test("ChartSpread(spreadAId): ecb-rate-dfr → スプレッド Insight を含む", () => {
    expect(slugsFor("ecb-rate-dfr")).toContain("ecb-fed-rate-diff-vs-eurusd");
  });

  test("マッチ無しは空配列", () => {
    expect(getInsightsForSeries("this-series-does-not-exist")).toEqual([]);
    expect(getInsightsForSeries("")).toEqual([]);
  });

  test("同一 slug は重複排除される", () => {
    for (const seriesId of [
      "edinet-kepco-net-income",
      "fuel-lng-jp-cif",
      "jepx-spot-tokyo",
    ]) {
      const slugs = slugsFor(seriesId);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  test("返る slug はすべて公開 Insight (INSIGHTS) に存在し title を持つ", () => {
    const known = new Set(INSIGHTS.map((i) => i.slug));
    for (const r of getInsightsForSeries("jepx-spot-tokyo")) {
      expect(known.has(r.slug)).toBe(true);
      expect(r.title).toBe(INSIGHTS.find((i) => i.slug === r.slug)?.title);
      expect(r.title.length).toBeGreaterThan(0);
    }
  });
});
