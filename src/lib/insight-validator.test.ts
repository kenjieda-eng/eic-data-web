import { describe, expect, test } from "vitest";
import {
  INSIGHT_DOMAINS,
  INSIGHT_RENDERERS,
  validateInsightFrontmatter,
} from "./insight-validator";

function makeValid(overrides: Record<string, unknown> = {}) {
  return {
    slug: "us-cpi-vs-fx-template",
    title: "テンプレ：米 CPI × USD/JPY",
    description:
      "米 CPI と USD/JPY 月中平均の 15 年相関を見る。米インフレ → FRB → 米金利 → 為替の連鎖を可視化。",
    publishedAt: "2026-05-12",
    author: "マコト",
    domain: "finance",
    tags: ["金融", "為替", "USD/JPY", "マクロ", "CPI"],
    indicators: ["us-cpi-yoy", "fx-usdjpy-monthly-avg"],
    renderer: "ChartDual",
    relatedInsights: ["spread-us-jp-10y-vs-fx", "us-2y-vs-jepx-tokyo"],
    ...overrides,
  };
}

describe("Phase C Day 1: validateInsightFrontmatter", () => {
  test("全フィールド正常で valid: true / errors: []", () => {
    const result = validateInsightFrontmatter(makeValid());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("slug 不在 → errors に 'slug is required'", () => {
    const result = validateInsightFrontmatter(
      makeValid({ slug: "" }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("slug is required");
  });

  test("title 40 字超 → errors に 'title must be ≤ 40 chars'", () => {
    const longTitle = "あ".repeat(50);
    const result = validateInsightFrontmatter(
      makeValid({ title: longTitle }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("title must be ≤ 40 chars");
  });

  test("tags 2 個以下 → errors に 'tags must be 3-5'", () => {
    const result = validateInsightFrontmatter(
      makeValid({ tags: ["金融", "為替"] }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("tags must be 3-5");
  });

  test("tags 6 個以上 → errors に 'tags must be 3-5'", () => {
    const result = validateInsightFrontmatter(
      makeValid({ tags: ["a", "b", "c", "d", "e", "f"] }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("tags must be 3-5");
  });

  test("domain 不正値 → errors に 'domain must be one of ...'", () => {
    const result = validateInsightFrontmatter(
      makeValid({ domain: "bogus" }),
    );
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.startsWith("domain must be one of")),
    ).toBe(true);
  });

  test("renderer 不正値 → errors に 'renderer must be one of ...'", () => {
    const result = validateInsightFrontmatter(
      makeValid({ renderer: "ChartBogus" }),
    );
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.startsWith("renderer must be one of")),
    ).toBe(true);
  });

  test("description 160 字超 + 複数違反は errors に同時に列挙", () => {
    const longDesc = "x".repeat(200);
    const result = validateInsightFrontmatter(
      makeValid({ description: longDesc, slug: "Bad_Slug" }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("description must be ≤ 160 chars");
    expect(
      result.errors.some((e) => e.includes("ASCII kebab-case")),
    ).toBe(true);
  });

  test("INSIGHT_DOMAINS が正準 12 ドメイン全列挙 (Polish #2 で 9 → 12)", () => {
    expect(INSIGHT_DOMAINS).toHaveLength(12);
    // catalog 実値に揃えた正準 ID
    for (const d of [
      "power",
      "fuel",
      "finance",
      "weather",
      "esg",
      "tech",
      "geopolitics",
      "regulation",
      "population",
      "corp_ir",
      "international",
      "economy",
    ]) {
      expect(INSIGHT_DOMAINS).toContain(d);
    }
    // 旧 drift ID は廃止済
    expect(INSIGHT_DOMAINS as readonly string[]).not.toContain("technology");
    expect(INSIGHT_DOMAINS as readonly string[]).not.toContain("policy");
  });

  test("INSIGHT_RENDERERS が 6 種列挙", () => {
    expect(INSIGHT_RENDERERS).toHaveLength(6);
    expect(INSIGHT_RENDERERS).toContain("ChartLagBars");
    expect(INSIGHT_RENDERERS).toContain("ChartSpread");
  });
});
