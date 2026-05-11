import { describe, expect, test } from "vitest";
import {
  detectAlerts,
  generateMorningSummary,
  getLatestMorningSummaryDate,
  getMorningNeighbors,
  getMorningSummary,
  listMorningSummaryDates,
  relatedInsightsForSummary,
} from "./morning-summary";

describe("Phase C Day 2: morning-summary", () => {
  test("listMorningSummaryDates: 5 日分 (5/13-5/17) を新しい順で返す", () => {
    const dates = listMorningSummaryDates();
    expect(dates).toHaveLength(5);
    expect(dates).toEqual([
      "2026-05-17",
      "2026-05-16",
      "2026-05-15",
      "2026-05-14",
      "2026-05-13",
    ]);
  });

  test("getLatestMorningSummaryDate: 最新は 2026-05-17", () => {
    expect(getLatestMorningSummaryDate()).toBe("2026-05-17");
  });

  test("getMorningSummary: 5/13 は 5 線、weekend=false、alerts=[]", () => {
    const s = getMorningSummary("2026-05-13")!;
    expect(s).not.toBeNull();
    expect(s.lines).toHaveLength(5);
    expect(s.weekend).toBe(false);
    expect(s.alerts).toEqual([]);
    expect(s.weekendNote).toBeNull();
    expect(s.lines[0].indicatorId).toBe("jepx-spot-tokyo");
  });

  test("getMorningSummary: 5/16, 5/17 は週末版 (weekend=true、weekendNote 有)", () => {
    const sat = getMorningSummary("2026-05-16")!;
    expect(sat.weekend).toBe(true);
    expect(sat.weekendNote).not.toBeNull();
    expect(sat.weekendNote).toContain("今週は");
    const sun = getMorningSummary("2026-05-17")!;
    expect(sun.weekend).toBe(true);
    expect(sun.weekendNote).toContain("来週");
  });

  test("getMorningSummary: 未登録日は null", () => {
    expect(getMorningSummary("2099-01-01")).toBeNull();
  });

  test("detectAlerts: 5/13 は ±3% 以内で alerts=[]", () => {
    const s = getMorningSummary("2026-05-13")!;
    expect(detectAlerts(s.lines)).toEqual([]);
  });

  test("detectAlerts: 5/15 は JEPX +4.03% で alerts=1 (急騰)", () => {
    const s = getMorningSummary("2026-05-15")!;
    const alerts = detectAlerts(s.lines);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].indicatorId).toBe("jepx-spot-tokyo");
    expect(alerts[0].dodPct).toBe(4.03);
    expect(alerts[0].message).toContain("急騰");
  });

  test("generateMorningSummary: 5/15 で alerts 自動補完 (登録時 [] → detectAlerts で 1 件)", async () => {
    const s = await generateMorningSummary("2026-05-15");
    expect(s).not.toBeNull();
    expect(s!.alerts).toHaveLength(1);
    expect(s!.alerts[0].indicatorId).toBe("jepx-spot-tokyo");
  });

  test("getMorningNeighbors: 5/14 は prev=5/13 + next=5/15", () => {
    const n = getMorningNeighbors("2026-05-14");
    expect(n.prev).toBe("2026-05-13");
    expect(n.next).toBe("2026-05-15");
  });

  test("getMorningNeighbors: 配列両端は片側 null", () => {
    const first = getMorningNeighbors("2026-05-13");
    expect(first.prev).toBeNull();
    expect(first.next).toBe("2026-05-14");
    const last = getMorningNeighbors("2026-05-17");
    expect(last.prev).toBe("2026-05-16");
    expect(last.next).toBeNull();
  });

  test("relatedInsightsForSummary: 5/13 は relatedInsightSlugs を優先して 5 本返す", () => {
    const s = getMorningSummary("2026-05-13")!;
    const related = relatedInsightsForSummary(s, undefined, 5);
    expect(related.length).toBe(5);
    const slugs = related.map((i) => i.slug);
    expect(slugs).toContain("lng-vs-price-tokyo");
    expect(slugs).toContain("spread-us-jp-10y-vs-fx");
    expect(slugs).toContain("fed-funds-vs-jepx-tokyo");
  });

  test("各日の解説文は 200-400 字目安、最小 80 字以上 (平日)", () => {
    for (const date of ["2026-05-13", "2026-05-14", "2026-05-15"]) {
      const s = getMorningSummary(date)!;
      for (const line of s.lines) {
        expect(line.explanation.length).toBeGreaterThanOrEqual(80);
      }
    }
  });
});
