import { describe, expect, test } from "vitest";
import { decompose3Factor, pearsonCorrelation } from "./derived";
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

  test("sinceYM: 指定月以降のみで計算（過去データを除外）2020-01〜のみ完全正相関", () => {
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

describe("decompose3Factor - 加法 3 要因分解", () => {
  // a0=2, b0=3 を基準月、後続月で a/b を変える
  const a: SeriesPoint[] = [
    { date: "2024-01-15", value: 2 }, // baseYM
    { date: "2024-02-15", value: 4 }, // dA=2
    { date: "2024-03-15", value: 4 }, // dA=2 + dB=2
  ];
  const b: SeriesPoint[] = [
    { date: "2024-01-15", value: 3 }, // baseYM
    { date: "2024-02-15", value: 3 }, // dB=0
    { date: "2024-03-15", value: 5 }, // dB=2
  ];

  test("基準月: 3 要因すべてゼロ + total=0", () => {
    const result = decompose3Factor(a, b, "2024-01");
    const base = result.find((p) => p.date === "2024-01-15");
    expect(base).toBeDefined();
    expect(base!.aEffect).toBe(0);
    expect(base!.bEffect).toBe(0);
    expect(base!.interaction).toBe(0);
    expect(base!.total).toBe(0);
  });

  test("A だけ変動: aEffect != 0、bEffect = 0、interaction = 0", () => {
    const result = decompose3Factor(a, b, "2024-01");
    const month2 = result.find((p) => p.date === "2024-02-15");
    expect(month2).toBeDefined();
    // a0=2, b0=3, aValue=4, bValue=3 → dA=2, dB=0
    expect(month2!.aEffect).toBe(6); // 2 * 3
    expect(month2!.bEffect).toBe(0); // 2 * 0
    expect(month2!.interaction).toBe(0); // 2 * 0
    expect(month2!.total).toBe(6);
  });

  test("A+B 両方変動: 恒等式 aEffect+bEffect+interaction === total = a·b − a₀·b₀", () => {
    const result = decompose3Factor(a, b, "2024-01");
    const month3 = result.find((p) => p.date === "2024-03-15");
    expect(month3).toBeDefined();
    // a0=2, b0=3, a=4, b=5 → dA=2, dB=2
    // aEffect=2*3=6, bEffect=2*2=4, interaction=2*2=4 → sum=14
    // a*b - a0*b0 = 20 - 6 = 14
    expect(month3!.aEffect).toBe(6);
    expect(month3!.bEffect).toBe(4);
    expect(month3!.interaction).toBe(4);
    expect(month3!.total).toBe(14);
    // 恒等式 strict ===
    expect(
      month3!.aEffect + month3!.bEffect + month3!.interaction,
    ).toBe(month3!.total);
    // 別計算経路: a*b - a0*b0
    const ab = 4 * 5;
    const a0b0 = 2 * 3;
    expect(month3!.total).toBe(ab - a0b0);
  });
});
