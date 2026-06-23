import { describe, expect, test } from "vitest";
import { extractInsightSlug, getInsightBySlug, INSIGHTS } from "./insights";

describe("SEO T2-2: insight breadcrumb slug 解決", () => {
  test("記事パス → slug を抽出し INSIGHTS で解決できる", () => {
    const first = INSIGHTS[0];
    const slug = extractInsightSlug(`/insight/${first.slug}`);
    expect(slug).toBe(first.slug);
    expect(getInsightBySlug(slug)?.title).toBe(first.title);
  });

  test("末尾スラッシュありでも slug を抽出できる", () => {
    expect(extractInsightSlug("/insight/jp-russia-decoupling/")).toBe(
      "jp-russia-decoupling",
    );
  });

  test("一覧 /insight・サブページ /insight/map は記事に解決しない (= breadcrumb 非表示)", () => {
    expect(getInsightBySlug(extractInsightSlug("/insight"))).toBeUndefined();
    expect(getInsightBySlug(extractInsightSlug("/insight/map"))).toBeUndefined();
    expect(
      getInsightBySlug(extractInsightSlug("/insight/network")),
    ).toBeUndefined();
  });

  test("null / 無関係パスでも例外を投げない", () => {
    expect(extractInsightSlug(null)).toBe("");
    expect(getInsightBySlug(extractInsightSlug(null))).toBeUndefined();
    expect(getInsightBySlug(extractInsightSlug("/catalog/foo"))).toBeUndefined();
  });
});
