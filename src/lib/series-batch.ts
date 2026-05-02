import { fetchSeries, type SeriesPoint, type SeriesMeta } from "./series";

export interface SeriesBundle {
  meta: SeriesMeta;
  points: SeriesPoint[];
}

/**
 * 複数系列を並列取得。Promise.all で並走、ISR キャッシュにより同一 build 内では 1 回のみ fetch。
 * 1 つでも失敗したら build を止める（MVP 方針）。
 */
export async function fetchSeriesBatch(
  ids: string[],
): Promise<Record<string, SeriesBundle>> {
  const results = await Promise.all(ids.map((id) => fetchSeries(id)));
  return Object.fromEntries(results.map((r, i) => [ids[i], r]));
}

/**
 * 系列を月次平均に集約。日次・月次どちらの入力も YYYY-MM-15 にスナップして返す。
 * value が null の点は除外。
 */
export function aggregateMonthly(points: SeriesPoint[]): SeriesPoint[] {
  const map = new Map<string, { sum: number; n: number }>();
  for (const p of points) {
    if (p.value === null) continue;
    const ym = p.date.slice(0, 7);
    const existing = map.get(ym);
    if (existing) {
      existing.sum += p.value;
      existing.n += 1;
    } else {
      map.set(ym, { sum: p.value, n: 1 });
    }
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ym, { sum, n }]) => ({
      date: `${ym}-15`,
      value: sum / n,
    }));
}

/**
 * 2 系列の月次データを共通月のみで揃える。月次でない場合は事前に aggregateMonthly を通すこと。
 */
export function alignMonthly(
  a: SeriesPoint[],
  b: SeriesPoint[],
): { date: string; aValue: number; bValue: number }[] {
  const aMap = new Map(
    a
      .filter((p): p is SeriesPoint & { value: number } => p.value !== null)
      .map((p) => [p.date.slice(0, 7), p.value]),
  );
  const bMap = new Map(
    b
      .filter((p): p is SeriesPoint & { value: number } => p.value !== null)
      .map((p) => [p.date.slice(0, 7), p.value]),
  );
  const commonMonths = [...aMap.keys()]
    .filter((ym) => bMap.has(ym))
    .sort();
  return commonMonths.map((ym) => ({
    date: `${ym}-15`,
    aValue: aMap.get(ym) as number,
    bValue: bMap.get(ym) as number,
  }));
}
