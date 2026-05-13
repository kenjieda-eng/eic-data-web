import { describe, expect, test } from "vitest";
import {
  EMPTY_ARCHIVE_FILTERS,
  filterSummaries,
  formatMonthLabel,
  groupByMonth,
  isValidIsoDate,
  listAllSummaries,
  summaryHaystack,
  summaryHeadline,
  summarySnippet,
} from "./archive-search";
import type { MorningSummary } from "./morning-summary";

const fixture = (date: string, explanation: string, value = 10): MorningSummary => ({
  date,
  weekday: "水",
  weekend: false,
  generatedAt: `${date}T07:00:00+09:00`,
  alerts: [],
  relatedInsightSlugs: [],
  weekendNote: null,
  lines: [
    {
      indicatorId: "jepx-spot-tokyo",
      label: "JEPX 東京",
      unit: "¥/kWh",
      value,
      dod: 0.1,
      dodPct: 1.0,
      editor: "ハル",
      explanation,
    },
  ],
});

const SAMPLE: Record<string, MorningSummary> = {
  "2026-05-13": fixture("2026-05-13", "JEPX 東京は前日比 +1.97% で 9.32 円/kWh、WTI 上昇が伝播"),
  "2026-05-14": fixture("2026-05-14", "USD/JPY 156.82 円、日銀政策修正観測"),
  "2026-04-30": fixture("2026-04-30", "月末締め: LNG 横這い、原発再稼働で関西安定"),
  "2026-04-15": fixture("2026-04-15", "Fed FF rate 据え置き、米 CPI 3.4%"),
};

describe("/today/archive: archive-search", () => {
  test("listAllSummaries: 全件を新しい順 (降順) で返す", () => {
    const r = listAllSummaries(SAMPLE);
    expect(r.map((s) => s.date)).toEqual([
      "2026-05-14",
      "2026-05-13",
      "2026-04-30",
      "2026-04-15",
    ]);
  });

  test("filterSummaries: query なし + 日付なしは全件を返す", () => {
    const all = listAllSummaries(SAMPLE);
    expect(filterSummaries(all, EMPTY_ARCHIVE_FILTERS)).toHaveLength(4);
  });

  test("filterSummaries: query で部分一致 (大文字小文字無視 + 日本語)", () => {
    const all = listAllSummaries(SAMPLE);
    const r1 = filterSummaries(all, { ...EMPTY_ARCHIVE_FILTERS, query: "USD/JPY" });
    expect(r1.map((s) => s.date)).toEqual(["2026-05-14"]);
    const r2 = filterSummaries(all, { ...EMPTY_ARCHIVE_FILTERS, query: "原発" });
    expect(r2.map((s) => s.date)).toEqual(["2026-04-30"]);
    const r3 = filterSummaries(all, { ...EMPTY_ARCHIVE_FILTERS, query: "cpi" });
    expect(r3.map((s) => s.date)).toEqual(["2026-04-15"]);
  });

  test("filterSummaries: fromDate / toDate (両端含む)", () => {
    const all = listAllSummaries(SAMPLE);
    const r1 = filterSummaries(all, {
      ...EMPTY_ARCHIVE_FILTERS,
      fromDate: "2026-05-01",
      toDate: null,
    });
    expect(r1.map((s) => s.date).sort()).toEqual(["2026-05-13", "2026-05-14"]);
    const r2 = filterSummaries(all, {
      ...EMPTY_ARCHIVE_FILTERS,
      fromDate: "2026-04-30",
      toDate: "2026-05-13",
    });
    expect(r2.map((s) => s.date).sort()).toEqual([
      "2026-04-30",
      "2026-05-13",
    ]);
  });

  test("filterSummaries: query + 日付範囲は AND 合成 (WTI は 5/13 のみ + fromDate=2026-05-01)", () => {
    const all = listAllSummaries(SAMPLE);
    const r = filterSummaries(all, {
      query: "WTI",
      fromDate: "2026-05-01",
      toDate: null,
    });
    expect(r.map((s) => s.date)).toEqual(["2026-05-13"]);
  });

  test("groupByMonth: 月ごとにまとめ降順、各月内も降順", () => {
    const all = listAllSummaries(SAMPLE);
    const groups = groupByMonth(all);
    expect(groups.map((g) => g.month)).toEqual(["2026-05", "2026-04"]);
    expect(groups[0].summaries.map((s) => s.date)).toEqual([
      "2026-05-14",
      "2026-05-13",
    ]);
    expect(groups[1].summaries.map((s) => s.date)).toEqual([
      "2026-04-30",
      "2026-04-15",
    ]);
  });

  test("summarySnippet: query 周辺 200 字を切り出し、両側に … を付与", () => {
    const long = "A".repeat(100) + "X-KEYWORD-Y" + "B".repeat(100);
    const s = fixture("2026-05-13", long);
    const snip = summarySnippet(s, "X-KEYWORD-Y", 80);
    expect(snip).toContain("X-KEYWORD-Y");
    expect(snip.startsWith("…")).toBe(true);
    expect(snip.endsWith("…")).toBe(true);
    expect(snip.length).toBeLessThanOrEqual(82);
  });

  test("summarySnippet: query なしは先頭から切り出し", () => {
    const s = fixture("2026-05-13", "JEPX 東京は前日比 +1.97% で 9.32 円/kWh");
    expect(summarySnippet(s, "")).toContain("JEPX");
  });

  test("summaryHeadline: 1 行目を「label ±X% value unit」形式に整形", () => {
    const s = fixture("2026-05-13", "any", 9.32);
    expect(summaryHeadline(s)).toBe("JEPX 東京 +1.00% 9.32 ¥/kWh");
  });

  test("summaryHaystack: lines.explanation + label + unit + 日付を全て含む", () => {
    const s = fixture("2026-05-13", "explanation-test");
    const h = summaryHaystack(s);
    expect(h).toContain("2026-05-13");
    expect(h).toContain("explanation-test");
    expect(h).toContain("jepx 東京");
    expect(h).toContain("¥/kwh");
  });

  test("formatMonthLabel: YYYY-MM → 'YYYY 年 M 月'", () => {
    expect(formatMonthLabel("2026-05")).toBe("2026 年 5 月");
    expect(formatMonthLabel("2025-12")).toBe("2025 年 12 月");
  });

  test("isValidIsoDate: YYYY-MM-DD のみ true", () => {
    expect(isValidIsoDate("2026-05-13")).toBe(true);
    expect(isValidIsoDate("2026/05/13")).toBe(false);
    expect(isValidIsoDate(null)).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
    expect(isValidIsoDate("2026-5-13")).toBe(false);
  });
});
