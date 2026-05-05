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

export interface DecompPoint {
  date: string;
  aEffect: number;
  bEffect: number;
  interaction: number;
  total: number;
}

/**
 * 加法 3 要因分解: Δ(A × B) = ΔA · B₀ + A₀ · ΔB + ΔA · ΔB
 *   - aEffect: A 要因の寄与 = ΔA · B₀
 *   - bEffect: B 要因の寄与 = A₀ · ΔB
 *   - interaction: 相乗効果 = ΔA · ΔB
 *   - total: 上記 3 つの和（≡ aValue·bValue − a₀·b₀、加法分解の恒等式）
 *
 * 入力は日次 / 月次どちらでも可（内部で aggregateMonthly + alignMonthly）。
 * baseYM は YYYY-MM、aligned 共通月集合の中に存在しないと throw。
 */
export function decompose3Factor(
  a: SeriesPoint[],
  b: SeriesPoint[],
  baseYM: string,
): DecompPoint[] {
  const aMonthly = aggregateMonthly(a);
  const bMonthly = aggregateMonthly(b);
  const aligned = alignMonthly(aMonthly, bMonthly);

  const base = aligned.find((p) => p.date.startsWith(baseYM));
  if (!base) {
    throw new Error(
      `decompose3Factor: baseYM ${baseYM} not found in aligned series intersection`,
    );
  }
  const a0 = base.aValue;
  const b0 = base.bValue;

  return aligned.map(({ date, aValue, bValue }) => {
    const dA = aValue - a0;
    const dB = bValue - b0;
    const aEffect = dA * b0;
    const bEffect = a0 * dB;
    const interaction = dA * dB;
    return {
      date,
      aEffect,
      bEffect,
      interaction,
      total: aEffect + bEffect + interaction,
    };
  });
}

export interface PearsonOptions {
  /** 直近 N 月だけで計算する。`alignMonthly` 後の末尾 N 件を採用。 */
  windowMonths?: number;
  /** "YYYY-MM" 以降の月のみで計算する（windowMonths より先に適用）。 */
  sinceYM?: string;
}

/**
 * 月次ピアソン相関。共通月で揃えた上で計算。
 * 3 点未満や分散ゼロの場合は null を返す（数値的に安定）。
 *
 * options を渡すと sinceYM → windowMonths の順でフィルタしてから相関を取る。
 * options 省略時は従来通り全期間で計算（後方互換）。
 */
export function pearsonCorrelation(
  a: SeriesPoint[],
  b: SeriesPoint[],
  options?: PearsonOptions,
): number | null {
  let aligned = alignMonthly(a, b);

  if (options?.sinceYM) {
    const cutoff = options.sinceYM;
    aligned = aligned.filter((p) => p.date.slice(0, 7) >= cutoff);
  }
  if (options?.windowMonths !== undefined && options.windowMonths > 0) {
    aligned = aligned.slice(-options.windowMonths);
  }

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
