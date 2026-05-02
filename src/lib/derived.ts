import {
  fetchSeriesBatch,
  aggregateMonthly,
  alignMonthly,
} from "./series-batch";
import type { SeriesPoint } from "./series";

export interface DerivedSeries {
  meta: {
    name: string;
    unit: string;
    depends_on: string[];
  };
  points: SeriesPoint[];
}

/**
 * 円建て LNG = LNG 日本 CIF ($/MMBtu) × USD/JPY (円/$) を月次で計算。
 * モック index-v2.html の renderInsightYieldVsFuel と同等。
 */
export async function fetchYenLng(): Promise<DerivedSeries> {
  const bundle = await fetchSeriesBatch([
    "fuel-lng-jp-cif",
    "fx-usdjpy-monthly-avg",
  ]);
  const lngMonthly = aggregateMonthly(bundle["fuel-lng-jp-cif"].points);
  const fxMonthly = aggregateMonthly(bundle["fx-usdjpy-monthly-avg"].points);
  const aligned = alignMonthly(lngMonthly, fxMonthly);

  const points: SeriesPoint[] = aligned.map(({ date, aValue, bValue }) => ({
    date,
    value: aValue * bValue,
  }));

  return {
    meta: {
      name: "円建て LNG（日本 CIF × USD/JPY）",
      unit: "円/MMBtu",
      depends_on: ["fuel-lng-jp-cif", "fx-usdjpy-monthly-avg"],
    },
    points,
  };
}

/**
 * 金利差 = aId - bId を月次で計算。pp（パーセンテージポイント）単位。
 */
export async function fetchRateSpread(
  spreadAId: string,
  spreadBId: string,
  spreadName: string,
): Promise<DerivedSeries> {
  const bundle = await fetchSeriesBatch([spreadAId, spreadBId]);
  const aMonthly = aggregateMonthly(bundle[spreadAId].points);
  const bMonthly = aggregateMonthly(bundle[spreadBId].points);
  const aligned = alignMonthly(aMonthly, bMonthly);

  const points: SeriesPoint[] = aligned.map(({ date, aValue, bValue }) => ({
    date,
    value: aValue - bValue,
  }));

  return {
    meta: {
      name: spreadName,
      unit: "pp",
      depends_on: [spreadAId, spreadBId],
    },
    points,
  };
}

/**
 * 月次ピアソン相関。共通月で揃えた上で計算。
 * 3 点未満や分散ゼロの場合は null を返す（数値的に安定）。
 */
export function pearsonCorrelation(
  a: SeriesPoint[],
  b: SeriesPoint[],
): number | null {
  const aligned = alignMonthly(a, b);
  if (aligned.length < 3) return null;

  const n = aligned.length;
  const meanA = aligned.reduce((s, p) => s + p.aValue, 0) / n;
  const meanB = aligned.reduce((s, p) => s + p.bValue, 0) / n;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (const { aValue, bValue } of aligned) {
    const da = aValue - meanA;
    const db = bValue - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }
  const denom = Math.sqrt(varA * varB);
  return denom === 0 ? null : cov / denom;
}
