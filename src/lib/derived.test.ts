import { describe, expect, test } from "vitest";
import { pearsonCorrelation } from "./derived";
import type { SeriesPoint } from "./series";

describe("pearsonCorrelation - L-010 window options", () => {
  test("options 無し: 既存挙動を維持（完全正相関 = 1）", () => {
    const a: SeriesPoint[] = [
      { date: "2020-01-15", value: 1 },
      { date: "2020-02-15", value: 2 },
      { date: "2020-03-15", value: 3 },
      { date: "2020-04-15", value: 4 },
    ];
    const b: SeriesPoint[] = [
      { date: "2020-01-15", value: 2 },
      { date: "2020-02-15", value: 4 },
      { date: "2020-03-15", value: 6 },
      { date: "2020-04-15", value: 8 },
    ];
    const r = pearsonCorrelation(a, b);
    expect(r).not.toBeNull();
    expect(r!).toBeCloseTo(1, 9);
  });

  test("windowMonths: 直近 N 月だけで再計算（前半の負相関を切り捨て）", () => {
    // 前半 3 月は負相関、後半 3 月は完全正相関
    const a: SeriesPoint[] = [
      { date: "2020-01-15", value: 1 },
      { date: "2020-02-15", value: 2 },
      { date: "2020-03-15", value: 3 },
      { date: "2020-04-15", value: 1 },
      { date: "2020-05-15", value: 2 },
      { date: "2020-06-15", value: 3 },
    ];
    const b: SeriesPoint[] = [
      { date: "2020-01-15", value: 3 },
      { date: "2020-02-15", value: 2 },
      { date: "2020-03-15", value: 1 },
      { date: "2020-04-15", value: 1 },
      { date: "2020-05-15", value: 2 },
      { date: "2020-06-15", value: 3 },
    ];
    const rAll = pearsonCorrelation(a, b);
    const rLast3 = pearsonCorrelation(a, b, { windowMonths: 3 });
    expect(rLast3).not.toBeNull();
    expect(rLast3!).toBeCloseTo(1, 9);
    expect(rAll).not.toBe(rLast3);
  });

  test("sinceYM: 指定月以降のみで計算（過去データを除外）", () => {
    const a: SeriesPoint[] = [
      { date: "2019-10-15", value: 5 },
      { date: "2019-11-15", value: 4 },
      { date: "2019-12-15", value: 3 },
      { date: "2020-01-15", value: 1 },
      { date: "2020-02-15", value: 2 },
      { date: "2020-03-15", value: 3 },
    ];
    const b: SeriesPoint[] = [
      { date: "2019-10-15", value: 1 },
      { date: "2019-11-15", value: 2 },
      { date: "2019-12-15", value: 3 },
      { date: "2020-01-15", value: 2 },
      { date: "2020-02-15", value: 4 },
      { date: "2020-03-15", value: 6 },
    ];
    // 2020-01 以降のみ → a=[1,2,3], b=[2,4,6] → 完全正相関 = 1
    const r2020 = pearsonCorrelation(a, b, { sinceYM: "2020-01" });
    expect(r2020).not.toBeNull();
    expect(r2020!).toBeCloseTo(1, 9);
  });
});
