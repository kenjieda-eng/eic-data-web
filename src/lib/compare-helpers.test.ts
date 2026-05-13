import { describe, expect, test } from "vitest";
import {
  COMPARE_MAX_SERIES,
  computeStats,
  DEFAULT_COMPARE_STATE,
  filterByPeriod,
  normalize,
  parseCompareQuery,
  serializeCompareQuery,
} from "./compare-helpers";
import type { SeriesPoint } from "./series";

const ptsMonthly: SeriesPoint[] = [
  { date: "2020-01-15", value: 100 },
  { date: "2020-06-15", value: 110 },
  { date: "2021-01-15", value: 120 },
  { date: "2023-01-15", value: 150 },
  { date: "2024-06-15", value: 200 },
  { date: "2025-01-15", value: 220 },
];

describe("/compare: filterByPeriod", () => {
  test('period="all" は入力そのまま', () => {
    expect(filterByPeriod(ptsMonthly, "all")).toEqual(ptsMonthly);
  });

  test('period="1y" は最終点から 1 年遡って絞り込み', () => {
    const out = filterByPeriod(ptsMonthly, "1y");
    // last = 2025-01-15、しきい値 = 2024-01-15 以降
    expect(out.map((p) => p.date)).toEqual(["2024-06-15", "2025-01-15"]);
  });

  test('period="5y" は最終点から 5 年遡る', () => {
    const out = filterByPeriod(ptsMonthly, "5y");
    // last = 2025-01-15、しきい値 = 2020-01-15 以降 (含む)
    expect(out.map((p) => p.date)).toEqual([
      "2020-01-15",
      "2020-06-15",
      "2021-01-15",
      "2023-01-15",
      "2024-06-15",
      "2025-01-15",
    ]);
  });

  test('period="custom" は from / to で範囲限定', () => {
    const out = filterByPeriod(
      ptsMonthly,
      "custom",
      "2021-01-01",
      "2024-12-31",
    );
    expect(out.map((p) => p.date)).toEqual([
      "2021-01-15",
      "2023-01-15",
      "2024-06-15",
    ]);
  });

  test('period="custom" は片側指定でも動作', () => {
    const outFromOnly = filterByPeriod(ptsMonthly, "custom", "2023-01-01");
    expect(outFromOnly.map((p) => p.date)).toEqual([
      "2023-01-15",
      "2024-06-15",
      "2025-01-15",
    ]);
    const outToOnly = filterByPeriod(ptsMonthly, "custom", null, "2020-12-31");
    expect(outToOnly.map((p) => p.date)).toEqual([
      "2020-01-15",
      "2020-06-15",
    ]);
  });

  test("空配列入力なら空配列を返す", () => {
    expect(filterByPeriod([], "5y")).toEqual([]);
    expect(filterByPeriod([], "custom", "2020-01-01")).toEqual([]);
  });
});

describe("/compare: normalize", () => {
  test('norm="raw" は入力そのまま', () => {
    expect(normalize(ptsMonthly, "raw")).toEqual(ptsMonthly);
  });

  test('norm="index100" は最初の値を 100 として比例', () => {
    const out = normalize(ptsMonthly, "index100");
    expect(out[0].value).toBeCloseTo(100, 6); // base = 100 → 100
    expect(out[1].value).toBeCloseTo(110, 6); // 110 / 100 * 100 = 110
    expect(out[5].value).toBeCloseTo(220, 6); // 220 / 100 * 100 = 220
  });

  test('norm="index100" で base=0 のとき raw にフォールバック', () => {
    const zeroBase: SeriesPoint[] = [
      { date: "2024-01-15", value: 0 },
      { date: "2024-02-15", value: 5 },
    ];
    const out = normalize(zeroBase, "index100");
    expect(out).toEqual(zeroBase);
  });

  test('norm="zscore" は平均 0、分散 1 になる', () => {
    const simple: SeriesPoint[] = [
      { date: "2024-01-15", value: 1 },
      { date: "2024-02-15", value: 2 },
      { date: "2024-03-15", value: 3 },
      { date: "2024-04-15", value: 4 },
      { date: "2024-05-15", value: 5 },
    ];
    const out = normalize(simple, "zscore");
    const values = out.map((p) => p.value as number);
    // mean = 3, std = sqrt(2)
    const expected = [-2, -1, 0, 1, 2].map(
      (v) => v / Math.sqrt(2),
    );
    values.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 6));
  });

  test("normalize は null を null のまま保持", () => {
    const withNull: SeriesPoint[] = [
      { date: "2024-01-15", value: 10 },
      { date: "2024-02-15", value: null },
      { date: "2024-03-15", value: 20 },
    ];
    const indexed = normalize(withNull, "index100");
    expect(indexed[1].value).toBeNull();
  });
});

describe("/compare: computeStats", () => {
  test("基本統計を計算 (count/min/max/mean/std/first/last)", () => {
    const s = computeStats(ptsMonthly);
    expect(s.count).toBe(6);
    expect(s.min).toBe(100);
    expect(s.max).toBe(220);
    expect(s.mean).toBeCloseTo(150, 6);
    expect(s.first).toEqual({ date: "2020-01-15", value: 100 });
    expect(s.last).toEqual({ date: "2025-01-15", value: 220 });
    expect(s.std).toBeGreaterThan(0);
  });

  test("空配列・全 null は null フィールドを返す", () => {
    expect(computeStats([])).toEqual({
      count: 0,
      min: null,
      max: null,
      mean: null,
      std: null,
      first: null,
      last: null,
    });
    expect(
      computeStats([{ date: "2024-01-15", value: null }]).count,
    ).toBe(0);
  });
});

describe("/compare: parseCompareQuery / serializeCompareQuery", () => {
  test("空クエリは DEFAULT_COMPARE_STATE を返す", () => {
    expect(parseCompareQuery({})).toEqual(DEFAULT_COMPARE_STATE);
  });

  test("ids は CSV 解釈、不正な enum は default にフォールバック", () => {
    const s = parseCompareQuery({
      ids: "a,b,c",
      period: "1y",
      norm: "zscore",
    });
    expect(s.ids).toEqual(["a", "b", "c"]);
    expect(s.period).toBe("1y");
    expect(s.norm).toBe("zscore");

    const bad = parseCompareQuery({ period: "wrong", norm: "??" });
    expect(bad.period).toBe(DEFAULT_COMPARE_STATE.period);
    expect(bad.norm).toBe(DEFAULT_COMPARE_STATE.norm);
  });

  test(`ids は最大 ${COMPARE_MAX_SERIES} 件で切り詰め`, () => {
    const s = parseCompareQuery({ ids: "a,b,c,d,e,f,g" });
    expect(s.ids).toHaveLength(COMPARE_MAX_SERIES);
    expect(s.ids).toEqual(["a", "b", "c", "d", "e"]);
  });

  test("from/to は YYYY-MM-DD のみ受理、不正形式は null", () => {
    const s1 = parseCompareQuery({
      period: "custom",
      from: "2020-01-01",
      to: "2024-12-31",
    });
    expect(s1.from).toBe("2020-01-01");
    expect(s1.to).toBe("2024-12-31");

    const s2 = parseCompareQuery({ from: "2020/01/01", to: "yesterday" });
    expect(s2.from).toBeNull();
    expect(s2.to).toBeNull();
  });

  test("serialize → parse は冪等 (round-trip)", () => {
    const state = {
      ids: ["jepx-tokyo-spot", "fuel-lng-jp-cif"],
      period: "custom" as const,
      from: "2020-01-01",
      to: "2024-12-31",
      norm: "index100" as const,
    };
    const qs = serializeCompareQuery(state);
    // qs は "?ids=...&period=custom&from=...&to=...&norm=index100" 形式
    expect(qs).toContain("ids=");
    expect(qs).toContain("period=custom");
    expect(qs).toContain("from=2020-01-01");
    expect(qs).toContain("norm=index100");

    // parseCompareQuery は Record<string, string | string[] | undefined> を期待
    const parsed = parseCompareQuery({
      ids: state.ids.join(","),
      period: state.period,
      from: state.from,
      to: state.to,
      norm: state.norm,
    });
    expect(parsed).toEqual(state);
  });

  test("default 値は URL に出さない (短い URL)", () => {
    expect(serializeCompareQuery(DEFAULT_COMPARE_STATE)).toBe("");
    expect(
      serializeCompareQuery({
        ids: ["a"],
        period: DEFAULT_COMPARE_STATE.period,
        from: null,
        to: null,
        norm: DEFAULT_COMPARE_STATE.norm,
      }),
    ).toBe("?ids=a");
  });
});
