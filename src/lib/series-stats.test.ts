import { describe, expect, test } from "vitest";
import { computeSeriesStats } from "./series-stats";
import type { SeriesPoint } from "./series";

describe("computeSeriesStats", () => {
  test("空配列は null", () => {
    expect(computeSeriesStats([], "monthly")).toBeNull();
  });

  test("全 null は null", () => {
    const pts: SeriesPoint[] = [
      { date: "2024-01-01", value: null },
      { date: "2024-02-01", value: null },
    ];
    expect(computeSeriesStats(pts, "monthly")).toBeNull();
  });

  test("monthly は前年同月にマッチする", () => {
    const pts: SeriesPoint[] = [
      { date: "2023-03-15", value: 100 },
      { date: "2023-09-15", value: 120 },
      { date: "2024-03-15", value: 150 },
    ];
    const s = computeSeriesStats(pts, "monthly");
    expect(s?.yearAgo?.date).toBe("2023-03-15");
    expect(s?.yearAgo?.value).toBe(100);
    // (150 − 100) / 100 × 100 = 50
    expect(s?.yearAgo?.changePct).toBeCloseTo(50, 6);
  });

  test("annual は latest の 1 つ前の非 null 点", () => {
    const pts: SeriesPoint[] = [
      { date: "2021-12-31", value: 10 },
      { date: "2022-12-31", value: null },
      { date: "2023-12-31", value: 20 },
      { date: "2024-12-31", value: 25 },
    ];
    const s = computeSeriesStats(pts, "annual");
    // null は除外されるので latest=2024、その 1 つ前の有効点は 2023
    expect(s?.yearAgo?.date).toBe("2023-12-31");
    expect(s?.yearAgo?.value).toBe(20);
  });

  test("daily は 365 日前 ±7 日を許容し、圏外なら省略", () => {
    // latest = 2025-01-10。target = 2024-01-10。
    const withinTol: SeriesPoint[] = [
      { date: "2024-01-05", value: 90 }, // target −5 日 → 許容内
      { date: "2024-06-01", value: 95 },
      { date: "2025-01-10", value: 110 },
    ];
    const inTol = computeSeriesStats(withinTol, "daily");
    expect(inTol?.yearAgo?.date).toBe("2024-01-05");

    // 最も近い過去点でも target から 30 日超 → 省略
    const outOfTol: SeriesPoint[] = [
      { date: "2024-03-01", value: 90 }, // target から 50 日
      { date: "2024-09-01", value: 95 },
      { date: "2025-01-10", value: 110 },
    ];
    const out = computeSeriesStats(outOfTol, "daily");
    expect(out?.yearAgo).toBeUndefined();
  });

  test("max/min は最初に出現した極値", () => {
    const pts: SeriesPoint[] = [
      { date: "2024-01-01", value: 50 },
      { date: "2024-02-01", value: 200 }, // 最大 (最初の 200)
      { date: "2024-03-01", value: 10 }, // 最小 (最初の 10)
      { date: "2024-04-01", value: 200 }, // 同値だが後発 → 採らない
      { date: "2024-05-01", value: 10 }, // 同値だが後発 → 採らない
    ];
    const s = computeSeriesStats(pts, "monthly");
    expect(s?.max).toEqual({ date: "2024-02-01", value: 200 });
    expect(s?.min).toEqual({ date: "2024-03-01", value: 10 });
    expect(s?.count).toBe(5);
    expect(s?.start).toBe("2024-01-01");
    expect(s?.end).toBe("2024-05-01");
    expect(s?.latest).toEqual({ date: "2024-05-01", value: 10 });
  });

  test("changePct はゼロ除算 (yearAgo=0) で null", () => {
    const pts: SeriesPoint[] = [
      { date: "2023-06-15", value: 0 },
      { date: "2024-06-15", value: 42 },
    ];
    const s = computeSeriesStats(pts, "monthly");
    expect(s?.yearAgo?.value).toBe(0);
    expect(s?.yearAgo?.changePct).toBeNull();
  });
});
