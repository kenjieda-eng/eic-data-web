import { describe, expect, test } from "vitest";
import type { Catalog, Indicator } from "./catalog";
import {
  SEARCH_CATEGORY_LABELS,
  buildSearchIndex,
  searchEntries,
} from "./search-index";
import { INSIGHTS } from "./insights";
import { GLOSSARY_TERMS } from "../app/glossary/data";

function makeIndicator(overrides: Partial<Indicator>): Indicator {
  return {
    id: overrides.id ?? "test-id",
    name: overrides.name ?? "テスト指標",
    domain: overrides.domain ?? "power",
    frequency: overrides.frequency ?? "monthly",
    unit: overrides.unit ?? "円/kWh",
    source_name: overrides.source_name ?? "JEPX",
    source_url: overrides.source_url ?? "https://example.com",
    license: overrides.license ?? "jepx-terms",
    observation_cutoff: overrides.observation_cutoff ?? "2026-04",
    updated_at: overrides.updated_at ?? "2026-05-01",
  };
}

const fixture: Catalog = {
  version: 1,
  schema: "1.0",
  generated_at: "2026-05-13T00:00:00Z",
  indicator_count: 3,
  indicators: [
    makeIndicator({ id: "jepx-spot-tokyo", name: "JEPX 東京", domain: "power" }),
    makeIndicator({
      id: "fuel-lng-jp-cif",
      name: "LNG 日本 CIF",
      domain: "fuel",
      unit: "USD/MMBtu",
      source_name: "World Bank",
    }),
    makeIndicator({
      id: "temp-tokyo",
      name: "東京気温",
      domain: "weather",
      unit: "℃",
      source_name: "気象庁",
    }),
  ],
};

describe("Phase B-C: search-index", () => {
  test("buildSearchIndex: 3 カテゴリの合計 = indicators + insights + glossary", () => {
    const index = buildSearchIndex(fixture);
    expect(index.totals.indicator).toBe(3);
    expect(index.totals.insight).toBe(INSIGHTS.length);
    expect(index.totals.glossary).toBe(GLOSSARY_TERMS.length);
    expect(index.totals.all).toBe(3 + INSIGHTS.length + GLOSSARY_TERMS.length);
  });

  test("searchEntries: 空クエリは全件返す", () => {
    const index = buildSearchIndex(fixture);
    const result = searchEntries(index, { query: "" });
    expect(result.entries.length).toBe(index.entries.length);
    expect(result.counts.all).toBe(index.entries.length);
  });

  test("searchEntries: クエリ「気温」は weather indicator + 関連 Insight をヒット (大文字小文字無視)", () => {
    const index = buildSearchIndex(fixture);
    const result = searchEntries(index, { query: "気温" });
    expect(result.counts.indicator).toBeGreaterThanOrEqual(1);
    expect(result.counts.insight).toBeGreaterThanOrEqual(1);
    expect(result.counts.all).toBe(
      result.counts.indicator + result.counts.insight + result.counts.glossary,
    );
  });

  test("searchEntries: category=indicator で indicator のみ", () => {
    const index = buildSearchIndex(fixture);
    const result = searchEntries(index, { query: "", category: "indicator" });
    expect(result.entries.every((e) => e.category === "indicator")).toBe(true);
    expect(result.entries).toHaveLength(3);
  });

  test("searchEntries: category=glossary で用語集のみ", () => {
    const index = buildSearchIndex(fixture);
    const result = searchEntries(index, { query: "", category: "glossary" });
    expect(result.entries.every((e) => e.category === "glossary")).toBe(true);
    expect(result.entries.length).toBe(GLOSSARY_TERMS.length);
  });

  test("searchEntries: クエリ「lng」は LNG 指標 + LNG 関連 Insight + JKM 用語をヒット", () => {
    const index = buildSearchIndex(fixture);
    const result = searchEntries(index, { query: "lng" });
    expect(result.counts.indicator).toBeGreaterThanOrEqual(1);
    expect(result.counts.insight).toBeGreaterThanOrEqual(1);
    expect(result.counts.glossary).toBeGreaterThanOrEqual(1);
  });

  test("SEARCH_CATEGORY_LABELS: 4 ラベル定義", () => {
    expect(SEARCH_CATEGORY_LABELS.all).toBe("全体");
    expect(SEARCH_CATEGORY_LABELS.indicator).toBe("指標カタログ");
    expect(SEARCH_CATEGORY_LABELS.insight).toBe("Insight");
    expect(SEARCH_CATEGORY_LABELS.glossary).toBe("用語集");
  });

  test("searchEntries: limit で truncated が立つ", () => {
    const index = buildSearchIndex(fixture);
    const result = searchEntries(index, { query: "", limit: 5 });
    expect(result.entries).toHaveLength(5);
    expect(result.truncated).toBe(true);
  });
});
