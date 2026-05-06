import { aggregateMonthly } from "./series-batch";
import type { SeriesBundle } from "./series-batch";

export interface HeatmapCell {
  xIndex: number;
  yIndex: number;
  value: number | null;
  date: string;
  id: string;
}

export interface HeatmapMatrix {
  cells: HeatmapCell[];
  months: string[];
  locationIds: string[];
  min: number;
  max: number;
}

/**
 * 複数地点の系列を月次集約し、最近 N 月分を locationCount × months の行列に展開。
 * 欠損値は null として保持（0 ではない）。最新月から遡って N 個を選ぶ。
 */
export function buildHeatmapData(
  bundles: Record<string, SeriesBundle>,
  indicatorIds: string[],
  months: number,
): HeatmapMatrix {
  const monthly = new Map<string, Map<string, number>>();
  for (const id of indicatorIds) {
    const bundle = bundles[id];
    const map = new Map<string, number>();
    if (bundle) {
      for (const p of aggregateMonthly(bundle.points)) {
        if (p.value === null) continue;
        map.set(p.date.slice(0, 7), p.value);
      }
    }
    monthly.set(id, map);
  }

  const allMonths = new Set<string>();
  for (const id of indicatorIds) {
    const m = monthly.get(id);
    if (!m) continue;
    for (const ym of m.keys()) allMonths.add(ym);
  }
  const sortedMonths = [...allMonths].sort();
  const recentMonths = sortedMonths.slice(-months);

  const cells: HeatmapCell[] = [];
  let min = Infinity;
  let max = -Infinity;
  for (let yIdx = 0; yIdx < indicatorIds.length; yIdx++) {
    const id = indicatorIds[yIdx];
    const map = monthly.get(id) ?? new Map();
    for (let xIdx = 0; xIdx < recentMonths.length; xIdx++) {
      const ym = recentMonths[xIdx];
      const v = map.has(ym) ? (map.get(ym) as number) : null;
      cells.push({ xIndex: xIdx, yIndex: yIdx, value: v, date: ym, id });
      if (v !== null && Number.isFinite(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
  }

  return {
    cells,
    months: recentMonths,
    locationIds: indicatorIds,
    min: min === Infinity ? 0 : min,
    max: max === -Infinity ? 0 : max,
  };
}
