import { describe, expect, test } from "vitest";
import { buildHeatmapData } from "./heatmap-data";
import type { SeriesBundle } from "./series-batch";
import type { SeriesMeta, SeriesPoint } from "./series";

const META: SeriesMeta = {
  id: "x",
  name: "x",
  unit: "u",
  source_name: "s",
  source_url: "https://example.com",
  observation_cutoff: "2025-12-01",
  license: "CC BY 4.0",
  domain: "test",
};

function bundle(id: string, points: SeriesPoint[]): SeriesBundle {
  return { meta: { ...META, id, name: id }, points };
}

function dailyMonth(ym: string, value: number | null): SeriesPoint[] {
  // 1 ヶ月分のサンプル（日次）。null は値ありの 1 点にする。
  const [y, m] = ym.split("-");
  const last = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
  return Array.from({ length: last }, (_, i) => ({
    date: `${ym}-${String(i + 1).padStart(2, "0")}`,
    value,
  }));
}

describe("buildHeatmapData", () => {
  test("9 系列 × 36 ヶ月の行列を正しく構築する", () => {
    const ids = Array.from({ length: 9 }, (_, i) => `id-${i}`);
    const months = Array.from({ length: 36 }, (_, i) => {
      const total = 2023 * 12 + i;
      const y = Math.floor(total / 12);
      const m = (total % 12) + 1;
      return `${y}-${String(m).padStart(2, "0")}`;
    });
    const bundles: Record<string, SeriesBundle> = {};
    for (const id of ids) {
      const points: SeriesPoint[] = [];
      for (const ym of months) points.push(...dailyMonth(ym, 1));
      bundles[id] = bundle(id, points);
    }

    const matrix = buildHeatmapData(bundles, ids, 36);

    expect(matrix.locationIds).toEqual(ids);
    expect(matrix.months).toHaveLength(36);
    expect(matrix.cells).toHaveLength(9 * 36);
    expect(matrix.min).toBe(1);
    expect(matrix.max).toBe(1);
    // (yIdx, xIdx) は引数順
    const cell = matrix.cells.find(
      (c) => c.yIndex === 3 && c.xIndex === 5,
    );
    expect(cell?.id).toBe("id-3");
    expect(cell?.value).toBe(1);
  });

  test("欠損値は null として保持される（0 ではない）", () => {
    const ids = ["a", "b"];
    const monthsList = ["2025-01", "2025-02", "2025-03"];
    // a は全月あり、b は 2025-02 が欠落
    const aPoints = monthsList.flatMap((ym) => dailyMonth(ym, 5));
    const bPoints = ["2025-01", "2025-03"].flatMap((ym) => dailyMonth(ym, 7));
    const bundles = {
      a: bundle("a", aPoints),
      b: bundle("b", bPoints),
    };

    const matrix = buildHeatmapData(bundles, ids, 3);

    const bCell2 = matrix.cells.find(
      (c) => c.yIndex === 1 && c.date === "2025-02",
    );
    expect(bCell2?.value).toBeNull();
    // a の 2025-02 は値あり
    const aCell2 = matrix.cells.find(
      (c) => c.yIndex === 0 && c.date === "2025-02",
    );
    expect(aCell2?.value).toBe(5);
    // min/max は null を除外
    expect(matrix.min).toBe(5);
    expect(matrix.max).toBe(7);
  });

  test("months 指定で最新月から N 個に絞り込む", () => {
    const ids = ["only"];
    const monthsList = [
      "2024-10",
      "2024-11",
      "2024-12",
      "2025-01",
      "2025-02",
      "2025-03",
    ];
    const points = monthsList.flatMap((ym) => dailyMonth(ym, 1));
    const bundles = { only: bundle("only", points) };

    const matrix = buildHeatmapData(bundles, ids, 3);

    expect(matrix.months).toEqual(["2025-01", "2025-02", "2025-03"]);
    expect(matrix.cells).toHaveLength(3);
  });
});
