import { describe, expect, test } from "vitest";
import { computeSpread } from "./spread-data";
import type { SeriesPoint } from "./series";

describe("computeSpread - L-013 §5 ChartSpread aValue/bValue 命名訂正", () => {
  test("月次入力: A - B が共通月のみで正しく計算される", () => {
    const a: SeriesPoint[] = [
      { date: "2024-01-15", value: 4.5 },
      { date: "2024-02-15", value: 4.6 },
      { date: "2024-03-15", value: 4.7 },
    ];
    const b: SeriesPoint[] = [
      { date: "2024-01-15", value: 1.0 },
      { date: "2024-02-15", value: 1.1 },
      { date: "2024-03-15", value: 1.2 },
    ];
    const result = computeSpread(a, b);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ date: "2024-01-15", value: 3.5 });
    expect(result[1].value).toBeCloseTo(3.5, 9);
    expect(result[2].value).toBeCloseTo(3.5, 9);
  });

  test("daily input: aggregateMonthly で月次化されてから差分が計算される", () => {
    // A = 月内日次平均 5.0、B = 月内日次平均 2.0、共通月 1 月のみ
    const a: SeriesPoint[] = [
      { date: "2024-01-05", value: 4 },
      { date: "2024-01-15", value: 5 },
      { date: "2024-01-25", value: 6 },
      { date: "2024-02-10", value: 99 }, // 2 月は B が無いので除外される
    ];
    const b: SeriesPoint[] = [
      { date: "2024-01-10", value: 1 },
      { date: "2024-01-20", value: 3 },
    ];
    const result = computeSpread(a, b);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2024-01-15");
    expect(result[0].value).toBeCloseTo(5 - 2, 9); // (4+5+6)/3 - (1+3)/2
  });

  test("負のスプレッド: B > A の場合は負値を返す（日米金利差で日本側が高い局面）", () => {
    const a: SeriesPoint[] = [{ date: "2010-06-15", value: 1.0 }]; // 米
    const b: SeriesPoint[] = [{ date: "2010-06-15", value: 1.5 }]; // 日
    const result = computeSpread(a, b);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBeCloseTo(-0.5, 9);
  });
});
