import { describe, expect, test } from "vitest";
import {
  averageSeries,
  buildKpi,
  computeSparklinePath,
  formatDelta,
  formatDeltaPct,
  JEPX_9_REGION_IDS,
  takeRecentValid,
  WATCH_CATEGORY_COLORS,
  WATCH_KPIS,
  type WatchKpiDef,
} from "./watch-data";
import type { SeriesPoint } from "./series";

describe("/watch: WATCH_KPIS 設定", () => {
  test("12 KPI 定義、id 重複なし、カテゴリ別に必要なバランス", () => {
    expect(WATCH_KPIS).toHaveLength(12);
    const ids = WATCH_KPIS.map((k) => k.id);
    expect(new Set(ids).size).toBe(12);

    const byCategory = WATCH_KPIS.reduce<Record<string, number>>(
      (acc, k) => ({ ...acc, [k.category]: (acc[k.category] ?? 0) + 1 }),
      {},
    );
    expect(byCategory["電力"]).toBe(6); // 5 area + 1 全国平均
    expect(byCategory["燃料"]).toBe(2);
    expect(byCategory["金融"]).toBe(2);
    expect(byCategory["需要・電源"]).toBe(2);
  });

  test("派生指標 'derived:jepx-9-region-avg' は 9 エリアを参照", () => {
    const avg = WATCH_KPIS.find((k) => k.id === "derived:jepx-9-region-avg");
    expect(avg).toBeDefined();
    expect(avg?.derivedFrom).toHaveLength(9);
    expect(avg?.derivedFrom).toEqual([...JEPX_9_REGION_IDS]);
  });

  test("4 カテゴリすべてに色定義 (#RRGGBB 形式)", () => {
    for (const c of ["電力", "燃料", "金融", "需要・電源"] as const) {
      expect(WATCH_CATEGORY_COLORS[c]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("/watch: takeRecentValid", () => {
  test("直近 N 点の non-null 値を時系列順で返す", () => {
    const pts: SeriesPoint[] = [
      { date: "2024-01-15", value: 1 },
      { date: "2024-02-15", value: null },
      { date: "2024-03-15", value: 3 },
      { date: "2024-04-15", value: 4 },
      { date: "2024-05-15", value: null },
      { date: "2024-06-15", value: 6 },
    ];
    expect(takeRecentValid(pts, 3)).toEqual([
      { date: "2024-03-15", value: 3 },
      { date: "2024-04-15", value: 4 },
      { date: "2024-06-15", value: 6 },
    ]);
  });

  test("全 null なら空配列、空入力なら空配列", () => {
    expect(takeRecentValid([], 5)).toEqual([]);
    expect(
      takeRecentValid(
        [
          { date: "2024-01-15", value: null },
          { date: "2024-02-15", value: null },
        ],
        5,
      ),
    ).toEqual([]);
  });
});

describe("/watch: buildKpi", () => {
  const def: WatchKpiDef = {
    id: "test-series",
    label: "Test",
    category: "電力",
  };

  test("通常ケース: last / prev / delta / deltaPct / sparkline を構築", () => {
    const pts: SeriesPoint[] = [
      { date: "2024-01-15", value: 100 },
      { date: "2024-02-15", value: 110 },
      { date: "2024-03-15", value: 120 },
      { date: "2024-04-15", value: 132 }, // 前期比 +12 / +10%
    ];
    const k = buildKpi({
      def,
      points: pts,
      unit: "¥/kWh",
      sourceName: "JEPX",
      sourceUrl: "https://example.com",
      observationCutoff: "2024-04-15",
    });
    expect(k.last).toEqual({ date: "2024-04-15", value: 132 });
    expect(k.prev).toEqual({ date: "2024-03-15", value: 120 });
    expect(k.delta).toBe(12);
    expect(k.deltaPct).toBeCloseTo(10, 6);
    expect(k.sparkline).toHaveLength(4);
    expect(k.unit).toBe("¥/kWh");
    expect(k.source).toEqual({ name: "JEPX", url: "https://example.com" });
    expect(k.observationCutoff).toBe("2024-04-15");
  });

  test("空入力: 全フィールドが null/空", () => {
    const k = buildKpi({ def, points: [], unit: "¥/kWh" });
    expect(k.last).toBeNull();
    expect(k.prev).toBeNull();
    expect(k.delta).toBeNull();
    expect(k.deltaPct).toBeNull();
    expect(k.sparkline).toEqual([]);
  });

  test("1 点のみ: last のみ、delta は null", () => {
    const k = buildKpi({
      def,
      points: [{ date: "2024-01-15", value: 50 }],
      unit: "¥/kWh",
    });
    expect(k.last).toEqual({ date: "2024-01-15", value: 50 });
    expect(k.prev).toBeNull();
    expect(k.delta).toBeNull();
    expect(k.deltaPct).toBeNull();
  });

  test("prev=0 の場合 deltaPct は null (0 除算回避)", () => {
    const k = buildKpi({
      def,
      points: [
        { date: "2024-01-15", value: 0 },
        { date: "2024-02-15", value: 5 },
      ],
      unit: "¥/kWh",
    });
    expect(k.delta).toBe(5);
    expect(k.deltaPct).toBeNull();
  });

  test("unitOverride が定義されている場合は catalog の unit より優先", () => {
    const customDef: WatchKpiDef = {
      id: "derived:foo",
      label: "Foo",
      unitOverride: "¥/kWh",
      category: "電力",
    };
    const k = buildKpi({
      def: customDef,
      points: [{ date: "2024-01-15", value: 10 }],
      unit: "ignored unit",
    });
    expect(k.unit).toBe("¥/kWh");
  });
});

describe("/watch: averageSeries", () => {
  test("3 系列の共通月で mean を計算", () => {
    const a = [
      { date: "2024-01-15", value: 10 },
      { date: "2024-02-15", value: 20 },
      { date: "2024-03-15", value: 30 },
    ];
    const b = [
      { date: "2024-01-15", value: 20 },
      { date: "2024-02-15", value: 40 },
      { date: "2024-03-15", value: 60 },
    ];
    const c = [
      { date: "2024-01-15", value: 30 },
      { date: "2024-02-15", value: 60 },
      // 2024-03 欠損
    ];
    const avg = averageSeries([
      { id: "a", points: a },
      { id: "b", points: b },
      { id: "c", points: c },
    ]);
    // 共通月: 1, 2 のみ
    expect(avg).toHaveLength(2);
    expect(avg[0]).toEqual({ date: "2024-01-15", value: 20 }); // (10+20+30)/3
    expect(avg[1]).toEqual({ date: "2024-02-15", value: 40 }); // (20+40+60)/3
  });

  test("null と非有限値を除外して mean", () => {
    const a = [
      { date: "2024-01-15", value: 10 },
      { date: "2024-02-15", value: null },
    ];
    const b = [
      { date: "2024-01-15", value: 20 },
      { date: "2024-02-15", value: 40 },
    ];
    const avg = averageSeries([
      { id: "a", points: a },
      { id: "b", points: b },
    ]);
    // 2024-02 は a が null なので intersection から外れる
    expect(avg).toEqual([{ date: "2024-01-15", value: 15 }]);
  });

  test("空入力なら空配列", () => {
    expect(averageSeries([])).toEqual([]);
    expect(
      averageSeries([{ id: "a", points: [{ date: "2024-01-15", value: null }] }]),
    ).toEqual([]);
  });
});

describe("/watch: formatDelta / formatDeltaPct", () => {
  test("正/負/ゼロ/null を整形", () => {
    expect(formatDelta(1.234)).toEqual({ sign: "+", text: "+1.23" });
    expect(formatDelta(-2.5)).toEqual({ sign: "-", text: "-2.5" });
    expect(formatDelta(0)).toEqual({ sign: "0", text: "0" });
    expect(formatDelta(null)).toEqual({ sign: "0", text: "—" });
    expect(formatDelta(NaN)).toEqual({ sign: "0", text: "—" });

    expect(formatDeltaPct(2.34)).toEqual({ sign: "+", text: "+2.3%" });
    expect(formatDeltaPct(-5.0)).toEqual({ sign: "-", text: "-5.0%" });
    expect(formatDeltaPct(0)).toEqual({ sign: "0", text: "0%" });
    expect(formatDeltaPct(null)).toEqual({ sign: "0", text: "—" });
  });
});

describe("/watch: computeSparklinePath", () => {
  test("複数点で M / L コマンドを連結", () => {
    const pts = [
      { date: "2024-01-15", value: 0 },
      { date: "2024-02-15", value: 50 },
      { date: "2024-03-15", value: 100 },
    ];
    const out = computeSparklinePath(pts, 100, 30);
    expect(out.path.startsWith("M ")).toBe(true);
    expect(out.path).toContain("L ");
    expect(out.lastX).toBeCloseTo(100, 1);
    // value=100 (max) で padV を考慮しても上方寄せ、y < height/2
    expect(out.lastY).toBeLessThan(15);
  });

  test("空配列なら空 path、1 点なら M のみ", () => {
    expect(computeSparklinePath([], 100, 30).path).toBe("");
    const single = computeSparklinePath(
      [{ date: "2024-01-15", value: 10 }],
      100,
      30,
    );
    expect(single.path).toBe("M 50 15");
  });

  test("全点同値でも例外なく描画 (padV のフォールバック)", () => {
    const flat = [
      { date: "2024-01-15", value: 5 },
      { date: "2024-02-15", value: 5 },
      { date: "2024-03-15", value: 5 },
    ];
    const out = computeSparklinePath(flat, 100, 30);
    expect(out.path).toContain("M");
    expect(out.lastX).toBeCloseTo(100, 1);
    expect(out.lastY).toBeGreaterThanOrEqual(0);
    expect(out.lastY).toBeLessThanOrEqual(30);
  });
});
