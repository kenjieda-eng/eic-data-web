import { describe, expect, test } from "vitest";
import {
  applySingleOp,
  computeLagSweep,
  DEFAULT_PLAYGROUND_PARAMS,
  DEFAULT_PLAYGROUND_STATE,
  logDiffSeries,
  movingAverage,
  parsePlaygroundQuery,
  pickLagPeak,
  PLAYGROUND_OPS,
  requiredSeriesCount,
  serializePlaygroundQuery,
  zscoreSeries,
} from "./playground-ops";
import type { SeriesPoint } from "./series";

describe("/playground: movingAverage", () => {
  test("window=3 で先頭 2 件は null、3 件目以降は単純平均", () => {
    const pts: SeriesPoint[] = [
      { date: "2024-01-15", value: 1 },
      { date: "2024-02-15", value: 2 },
      { date: "2024-03-15", value: 3 },
      { date: "2024-04-15", value: 4 },
      { date: "2024-05-15", value: 5 },
    ];
    const out = movingAverage(pts, 3);
    expect(out[0].value).toBeNull();
    expect(out[1].value).toBeNull();
    expect(out[2].value).toBeCloseTo(2, 6); // (1+2+3)/3
    expect(out[3].value).toBeCloseTo(3, 6); // (2+3+4)/3
    expect(out[4].value).toBeCloseTo(4, 6); // (3+4+5)/3
  });

  test("窓内に null があれば結果も null", () => {
    const pts: SeriesPoint[] = [
      { date: "2024-01-15", value: 1 },
      { date: "2024-02-15", value: null },
      { date: "2024-03-15", value: 3 },
    ];
    const out = movingAverage(pts, 3);
    expect(out[2].value).toBeNull();
  });

  test("window=1 で値そのまま (実質 identity)", () => {
    const pts: SeriesPoint[] = [
      { date: "2024-01-15", value: 1 },
      { date: "2024-02-15", value: 2 },
    ];
    const out = movingAverage(pts, 1);
    expect(out[0].value).toBe(1);
    expect(out[1].value).toBe(2);
  });
});

describe("/playground: zscoreSeries", () => {
  test("平均 0 / 標準偏差 1 になる (1..5 の系列)", () => {
    const pts: SeriesPoint[] = [
      { date: "2024-01-15", value: 1 },
      { date: "2024-02-15", value: 2 },
      { date: "2024-03-15", value: 3 },
      { date: "2024-04-15", value: 4 },
      { date: "2024-05-15", value: 5 },
    ];
    const out = zscoreSeries(pts);
    // mean=3, std=sqrt(2)
    const expected = [-2, -1, 0, 1, 2].map((v) => v / Math.sqrt(2));
    out.forEach((p, i) => {
      expect(p.value).toBeCloseTo(expected[i], 6);
    });
  });

  test("全点同値で std=0 なら全 0、null は null のまま", () => {
    const pts: SeriesPoint[] = [
      { date: "2024-01-15", value: 5 },
      { date: "2024-02-15", value: 5 },
      { date: "2024-03-15", value: null },
    ];
    const out = zscoreSeries(pts);
    expect(out[0].value).toBe(0);
    expect(out[1].value).toBe(0);
    expect(out[2].value).toBeNull();
  });

  test("空入力なら入力をそのまま返す", () => {
    expect(zscoreSeries([])).toEqual([]);
  });
});

describe("/playground: logDiffSeries", () => {
  test("ln(x_t) - ln(x_{t-1}) で前期比対数差分", () => {
    const pts: SeriesPoint[] = [
      { date: "2024-01-15", value: 100 },
      { date: "2024-02-15", value: 110 }, // ln(1.1)
      { date: "2024-03-15", value: 121 }, // ln(1.1)
    ];
    const out = logDiffSeries(pts);
    expect(out[0].value).toBeNull(); // 先頭は null
    expect(out[1].value).toBeCloseTo(Math.log(1.1), 6);
    expect(out[2].value).toBeCloseTo(Math.log(1.1), 6);
  });

  test("0 以下 / null の点は null を出力", () => {
    const pts: SeriesPoint[] = [
      { date: "2024-01-15", value: 100 },
      { date: "2024-02-15", value: 0 }, // 0 以下 → null
      { date: "2024-03-15", value: 100 }, // 前期 = 0 → null
      { date: "2024-04-15", value: null },
      { date: "2024-05-15", value: 100 }, // 前期 = null → null
    ];
    const out = logDiffSeries(pts);
    expect(out[1].value).toBeNull();
    expect(out[2].value).toBeNull();
    expect(out[3].value).toBeNull();
    expect(out[4].value).toBeNull();
  });
});

describe("/playground: computeLagSweep + pickLagPeak", () => {
  test("完全同期データで lag=0 が r=1 のピーク", () => {
    // 月次 6 点の同期 series (a と b は同一)
    const a: SeriesPoint[] = [
      { date: "2024-01-15", value: 1 },
      { date: "2024-02-15", value: 2 },
      { date: "2024-03-15", value: 4 },
      { date: "2024-04-15", value: 3 },
      { date: "2024-05-15", value: 5 },
      { date: "2024-06-15", value: 6 },
    ];
    const b: SeriesPoint[] = a.map((p) => ({ ...p }));
    const sweep = computeLagSweep(a, b, 3);
    expect(sweep.length).toBeGreaterThan(0);
    const peak = pickLagPeak(sweep);
    expect(peak).not.toBeNull();
    expect(peak!.lagMonths).toBe(0);
    expect(peak!.r).toBeCloseTo(1, 6);
  });

  test("空入力なら sweep 空、ピークは null", () => {
    expect(computeLagSweep([], [], 6)).toEqual([]);
    expect(pickLagPeak([])).toBeNull();
  });
});

describe("/playground: applySingleOp", () => {
  test("op='ma' → movingAverage、op='zscore' → zscoreSeries、op='logdiff' → logDiffSeries", () => {
    const pts: SeriesPoint[] = [
      { date: "2024-01-15", value: 1 },
      { date: "2024-02-15", value: 2 },
      { date: "2024-03-15", value: 3 },
      { date: "2024-04-15", value: 4 },
      { date: "2024-05-15", value: 5 },
      { date: "2024-06-15", value: 6 },
    ];
    const ma = applySingleOp(pts, "ma", DEFAULT_PLAYGROUND_PARAMS);
    expect(ma).toHaveLength(pts.length);
    // MA(6) の最後の値 = mean(1..6) = 3.5
    expect(ma[5].value).toBeCloseTo(3.5, 6);

    const zs = applySingleOp(pts, "zscore", DEFAULT_PLAYGROUND_PARAMS);
    expect(zs[0].value).toBeLessThan(0);
    expect(zs[5].value).toBeGreaterThan(0);

    const ld = applySingleOp(pts, "logdiff", DEFAULT_PLAYGROUND_PARAMS);
    expect(ld[0].value).toBeNull();
    expect(ld[5].value).toBeCloseTo(Math.log(6 / 5), 6);
  });
});

describe("/playground: parsePlaygroundQuery / serializePlaygroundQuery", () => {
  test("空クエリ → DEFAULT_PLAYGROUND_STATE", () => {
    expect(parsePlaygroundQuery({})).toEqual(DEFAULT_PLAYGROUND_STATE);
  });

  test("op が enum 外 → default、lag/ma も範囲外なら default", () => {
    const s = parsePlaygroundQuery({
      op: "invalid",
      lag: "999",
      ma: "7",
    });
    expect(s.op).toBe(DEFAULT_PLAYGROUND_STATE.op);
    expect(s.maxLag).toBe(DEFAULT_PLAYGROUND_STATE.maxLag);
    expect(s.maWindow).toBe(DEFAULT_PLAYGROUND_STATE.maWindow);
  });

  test("serialize → parse は冪等 (round-trip)", () => {
    const state = {
      a: "jepx-spot-tokyo",
      b: "fuel-lng-jp-cif",
      op: "lag" as const,
      maxLag: 18,
      maWindow: 6,
    };
    const qs = serializePlaygroundQuery(state);
    expect(qs).toContain("a=jepx-spot-tokyo");
    expect(qs).toContain("op=lag");
    expect(qs).toContain("lag=18");
    expect(qs).not.toContain("ma="); // op=lag では maWindow は出さない

    const parsed = parsePlaygroundQuery({
      a: state.a,
      b: state.b,
      op: state.op,
      lag: String(state.maxLag),
    });
    expect(parsed).toEqual(state);
  });

  test("default 値は URL に出さず短い URL に", () => {
    expect(serializePlaygroundQuery(DEFAULT_PLAYGROUND_STATE)).toBe("");
    expect(
      serializePlaygroundQuery({
        a: "x",
        b: null,
        op: DEFAULT_PLAYGROUND_STATE.op,
        maxLag: DEFAULT_PLAYGROUND_STATE.maxLag,
        maWindow: DEFAULT_PLAYGROUND_STATE.maWindow,
      }),
    ).toBe("?a=x");
  });

  test("PLAYGROUND_OPS は 5 種、requiredSeriesCount は correlation/lag=2 それ以外=1", () => {
    expect(PLAYGROUND_OPS).toHaveLength(5);
    expect(requiredSeriesCount("correlation")).toBe(2);
    expect(requiredSeriesCount("lag")).toBe(2);
    expect(requiredSeriesCount("ma")).toBe(1);
    expect(requiredSeriesCount("zscore")).toBe(1);
    expect(requiredSeriesCount("logdiff")).toBe(1);
  });
});
