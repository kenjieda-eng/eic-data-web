import { aggregateMonthly, alignMonthly } from "./series-batch";
import type { SeriesPoint } from "./series";

export interface SpreadPoint {
  date: string;
  value: number;
}

/**
 * 2 系列の差分（A - B）を月次で計算。
 *
 * 設計書 §5 ChartSpread の `valueA/valueB` 命名は実コード `alignMonthly` の
 * 戻り型 `aValue/bValue` に合わせて訂正済（L-013 §5 訂正、Day 6 §3 ChartDecomp と同パターン）。
 *
 * daily input の場合は内部で aggregateMonthly に通してから alignMonthly。
 * 月次入力でも aggregateMonthly は idempotent (YYYY-MM-15 にスナップ)。
 */
export function computeSpread(
  a: SeriesPoint[],
  b: SeriesPoint[],
): SpreadPoint[] {
  const aMonthly = aggregateMonthly(a);
  const bMonthly = aggregateMonthly(b);
  const aligned = alignMonthly(aMonthly, bMonthly);
  return aligned.map(({ date, aValue, bValue }) => ({
    date,
    value: aValue - bValue,
  }));
}
