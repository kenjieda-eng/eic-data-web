import { describe, expect, test } from "vitest";
import {
  groupInsights,
  validateInsights,
  type InsightGroup,
} from "./grouping";
import type { Insight } from "./insights";
import { INSIGHTS } from "./insights";

describe("Phase B-B Day 3: grouping ロジック", () => {
  test("groupInsights: 41 本を 6 軸 + 未分類に分類、合計が一致", () => {
    const { groups, unclassified } = groupInsights(INSIGHTS);
    expect(groups).toHaveLength(6);
    const totalInGroups = groups.reduce((s, g) => s + g.insights.length, 0);
    expect(totalInGroups + unclassified.length).toBe(INSIGHTS.length);
  });

  test("groupInsights: 気象 × 電力グループに 9 region 系の温度系列が入る", () => {
    const { groups } = groupInsights(INSIGHTS);
    const weather = groups.find((g) => g.group.id === "weather-x-power")!;
    const slugs = weather.insights.map((i) => i.slug);
    expect(slugs).toContain("temp-vs-price");
    expect(slugs).toContain("temp-min-hokkaido-vs-price");
    expect(slugs).toContain("temp-vs-price-tohoku");
  });

  test("groupInsights: 1 つの slug が複数グループに含まれない (排他分類)", () => {
    const { groups } = groupInsights(INSIGHTS);
    const counts = new Map<string, number>();
    for (const g of groups) {
      for (const i of g.insights) {
        counts.set(i.slug, (counts.get(i.slug) ?? 0) + 1);
      }
    }
    for (const [slug, count] of counts) {
      expect(count, `slug ${slug} 重複`).toBe(1);
    }
  });

  test("validateInsights: モック側 macro グループの実装乖離 slug を orphan として検出", () => {
    const result = validateInsights(INSIGHTS);
    expect(result.duplicateSlugs).toEqual([]);
    expect(result.unclassifiedSlugs).toContain("multi-region-jepx-comparison");
    expect(result.unclassifiedSlugs).toContain("region-fuel-sensitivity");
    expect(result.totalIssues).toBe(
      result.orphanSlugs.length +
        result.unclassifiedSlugs.length +
        result.duplicateSlugs.length,
    );
  });

  test("validateInsights: 重複 slug を検出する", () => {
    const dup: Insight[] = [
      ...INSIGHTS,
      { ...INSIGHTS[0], title: "duplicate clone" },
    ];
    const result = validateInsights(dup);
    expect(result.duplicateSlugs).toEqual([INSIGHTS[0].slug]);
  });

  test("validateInsights: groups にあるが INSIGHTS にない slug を orphan に追加", () => {
    const groupsWithGhost: InsightGroup[] = [
      {
        id: "ghost",
        icon: "👻",
        title: "テスト",
        lede: "test",
        slugs: ["temp-vs-price", "non-existent-slug"],
      },
    ];
    const result = validateInsights(INSIGHTS, groupsWithGhost);
    expect(result.orphanSlugs).toEqual([
      { groupId: "ghost", slug: "non-existent-slug" },
    ]);
  });

  test("groupInsights: 未分類 (multi-region-jepx-comparison + region-fuel-sensitivity) を unclassified に集める", () => {
    const { unclassified } = groupInsights(INSIGHTS);
    const slugs = unclassified.map((i) => i.slug);
    expect(slugs).toContain("multi-region-jepx-comparison");
    expect(slugs).toContain("region-fuel-sensitivity");
  });
});

describe("Phase B-A Day 13: Insight #40-#42 着地で 41/41 達成 + Week 1 Day 3 で #42 fuel-cost-decomp 追加 + Day 4 で #43-#47 を 5 本追加 + Day 5 朝で #48-#50 + Day 5 午後で #51 + Day 5 午後第 2 弾で #52-#54 + Day 5 午後第 3 弾で #55-#56 + Day 5 午後第 4 弾で #57-#58 (日本 CPI/鉱工業) 追加 + Phase D 第 1 期 Day 1 で #61 capacity-market-5-year-trends 追加 + D-018 で #62-#63 需給調整市場 2 本 追加 + #64 容量市場エリア別 + 5/25 で #65 balancing-source-type-comparison (電源種別別) 追加 + Phase 2 国際ドメイン第 1 弾で #66 ecb-fed-rate-diff-vs-eurusd 追加", () => {
  test("INSIGHTS は 69 件 (5/27 batch 2 remediation で #48 eu-ets-vs-yen-lng を draft 退避 = 66 → 65、5/28 Phase 2 Ember 第 1 弾 #67 world-power-co2-intensity 追加で 66、Ember 第 2 弾 #68 world-power-mix-compare 追加で 67、Ember 第 3 弾 (日本単独) #69 japan-power-mix-trend 追加で 68、5/29 方法論ライブラリ Day 1 #70 jepx-tokyo-monthly-regression 追加で 69)", () => {
    expect(INSIGHTS).toHaveLength(69);
  });

  test("Day 13 で追加した 3 slug (us-cpi-vs-fx / fed-funds-vs-jepx-tokyo / us-industrial-vs-jp-demand) が INSIGHTS に存在", () => {
    const slugs = new Set(INSIGHTS.map((i) => i.slug));
    expect(slugs.has("us-cpi-vs-fx")).toBe(true);
    expect(slugs.has("fed-funds-vs-jepx-tokyo")).toBe(true);
    expect(slugs.has("us-industrial-vs-jp-demand")).toBe(true);
  });

  test("Day 13 で追加した 3 slug は macro グループに分類される (unclassified に落ちない)", () => {
    const { groups, unclassified } = groupInsights(INSIGHTS);
    const macro = groups.find((g) => g.group.id === "macro")!;
    const macroSlugs = macro.insights.map((i) => i.slug);
    expect(macroSlugs).toContain("us-cpi-vs-fx");
    expect(macroSlugs).toContain("fed-funds-vs-jepx-tokyo");
    expect(macroSlugs).toContain("us-industrial-vs-jp-demand");
    const unclassifiedSlugs = unclassified.map((i) => i.slug);
    expect(unclassifiedSlugs).not.toContain("us-cpi-vs-fx");
    expect(unclassifiedSlugs).not.toContain("fed-funds-vs-jepx-tokyo");
    expect(unclassifiedSlugs).not.toContain("us-industrial-vs-jp-demand");
  });
});
