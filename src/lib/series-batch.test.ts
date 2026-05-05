import { describe, expect, test } from "vitest";
import { shiftMonths } from "./series-batch";
import type { SeriesPoint } from "./series";

describe("shiftMonths - L-013 lag correlation helper", () => {
  test("lagMonths = 0: 入力配列をそのまま返す（参照同一性保持）", () => {
    const input: SeriesPoint[] = [
      { date: "2024-01-15", value: 1 },
      { date: "2024-02-15", value: 2 },
    ];
    expect(shiftMonths(input, 0)).toBe(input);
  });

  test("lagMonths = 3: 各 date が 3 ヶ月後にシフト、value 不変", () => {
    const input: SeriesPoint[] = [
      { date: "2024-01-15", value: 10 },
      { date: "2024-02-15", value: 20 },
      { date: "2024-09-15", value: 30 },
    ];
    expect(shiftMonths(input, 3)).toEqual([
      { date: "2024-04-15", value: 10 },
      { date: "2024-05-15", value: 20 },
      { date: "2024-12-15", value: 30 },
    ]);
  });

  test("lagMonths = 12: 年跨ぎを正しく処理", () => {
    const input: SeriesPoint[] = [
      { date: "2024-06-15", value: 1 },
      { date: "2024-12-15", value: 2 },
      { date: "2025-01-15", value: 3 },
    ];
    expect(shiftMonths(input, 12)).toEqual([
      { date: "2025-06-15", value: 1 },
      { date: "2025-12-15", value: 2 },
      { date: "2026-01-15", value: 3 },
    ]);
  });
});
