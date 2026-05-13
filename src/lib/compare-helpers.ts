/**
 * /compare ページの純粋関数ヘルパ群
 *
 * 系列比較の三本柱:
 *   1. 正規化 (normalize): raw / index100 / zscore — 単位の異なる系列を 1 軸で重ね描き可能に
 *   2. 期間絞り込み (filterByPeriod): all / 5y / 1y / custom (from-to)
 *   3. 統計サマリー (computeStats): count / min / max / mean / std / first / last
 *
 * すべて SeriesPoint[] (= { date: ISO, value: number | null }) を入出力。
 * 副作用なし、SSR/CSR 両方で利用可能。
 */
import type { SeriesPoint } from "./series";

export const COMPARE_NORMS = ["raw", "index100", "zscore"] as const;
export type CompareNorm = (typeof COMPARE_NORMS)[number];

export const COMPARE_PERIODS = ["all", "5y", "1y", "custom"] as const;
export type ComparePeriod = (typeof COMPARE_PERIODS)[number];

export const COMPARE_MAX_SERIES = 5;

/** 系列ごとの色 (最大 5 系列、視覚的に区別しやすい 5 色) */
export const COMPARE_COLORS = [
  "#047857", // emerald-700
  "#9333ea", // violet-600
  "#0891b2", // cyan-600
  "#dc2626", // red-600
  "#f59e0b", // amber-500
] as const;

/**
 * 期間 + (任意の) from/to から、フィルタ後の SeriesPoint[] を返す。
 *   - period = "all": 全データ
 *   - "5y" / "1y": 最終点 (= 系列内の最大日付) から N 年遡る
 *   - "custom": from / to の両方が ISO 形式の場合のみ範囲適用、片方欠落なら指定された片側のみ適用
 * 入力が空配列なら空を返す。
 */
export function filterByPeriod(
  points: SeriesPoint[],
  period: ComparePeriod,
  from?: string | null,
  to?: string | null,
): SeriesPoint[] {
  if (points.length === 0) return points;

  if (period === "all") return points;

  if (period === "custom") {
    return points.filter((p) => {
      if (from && p.date < from) return false;
      if (to && p.date > to) return false;
      return true;
    });
  }

  // "5y" / "1y"
  const years = period === "5y" ? 5 : 1;
  const last = points[points.length - 1]?.date;
  if (!last) return points;
  const startYmd = subtractYearsFromYmd(last, years);
  return points.filter((p) => p.date >= startYmd);
}

function subtractYearsFromYmd(date: string, years: number): string {
  const parts = date.split("-");
  const y = parseInt(parts[0], 10);
  const m = parts[1] ?? "01";
  const d = parts[2] ?? "01";
  return `${y - years}-${m}-${d}`;
}

/**
 * 正規化:
 *   - "raw": そのまま
 *   - "index100": 最初の non-null 値を 100 として比例。基準値が 0 の場合は raw にフォールバック
 *   - "zscore": (x - mean) / std。std=0 なら 0 を返す
 * null は null のまま保持 (チャート上で欠損として表現)。
 */
export function normalize(
  points: SeriesPoint[],
  norm: CompareNorm,
): SeriesPoint[] {
  if (norm === "raw" || points.length === 0) return points;

  const values: number[] = [];
  for (const p of points) {
    if (p.value !== null && Number.isFinite(p.value)) values.push(p.value);
  }
  if (values.length === 0) return points;

  if (norm === "index100") {
    const base = values[0];
    if (base === 0) return points; // 0 除算回避: raw にフォールバック
    return points.map((p) => ({
      date: p.date,
      value: p.value === null ? null : (p.value / base) * 100,
    }));
  }

  // zscore
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) {
    return points.map((p) => ({
      date: p.date,
      value: p.value === null ? null : 0,
    }));
  }
  return points.map((p) => ({
    date: p.date,
    value: p.value === null ? null : (p.value - mean) / std,
  }));
}

export interface SeriesStats {
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  std: number | null;
  first: { date: string; value: number } | null;
  last: { date: string; value: number } | null;
}

/** 系列の Min/Max/Mean/Std/first/last を計算 (null は除外) */
export function computeStats(points: SeriesPoint[]): SeriesStats {
  const valid = points.filter(
    (p): p is SeriesPoint & { value: number } =>
      p.value !== null && Number.isFinite(p.value),
  );
  if (valid.length === 0) {
    return {
      count: 0,
      min: null,
      max: null,
      mean: null,
      std: null,
      first: null,
      last: null,
    };
  }
  const values = valid.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  return {
    count: valid.length,
    min,
    max,
    mean,
    std,
    first: { date: valid[0].date, value: valid[0].value },
    last: {
      date: valid[valid.length - 1].date,
      value: valid[valid.length - 1].value,
    },
  };
}

/**
 * URL クエリパラメータ ↔ 状態のシリアライズ。
 * ids は CSV、period/norm は enum チェック、from/to は YYYY-MM-DD 形式チェック。
 */
export interface CompareState {
  ids: string[];
  period: ComparePeriod;
  from: string | null;
  to: string | null;
  norm: CompareNorm;
}

export const DEFAULT_COMPARE_STATE: CompareState = {
  ids: [],
  period: "5y",
  from: null,
  to: null,
  norm: "raw",
};

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseCompareQuery(
  raw: Record<string, string | string[] | undefined>,
): CompareState {
  const idsStr = pickString(raw, "ids");
  const ids = idsStr
    ? idsStr.split(",").map((s) => s.trim()).filter(Boolean).slice(0, COMPARE_MAX_SERIES)
    : [];

  const periodRaw = pickString(raw, "period");
  const period: ComparePeriod = (COMPARE_PERIODS as readonly string[]).includes(
    periodRaw,
  )
    ? (periodRaw as ComparePeriod)
    : DEFAULT_COMPARE_STATE.period;

  const fromRaw = pickString(raw, "from");
  const toRaw = pickString(raw, "to");
  const from = fromRaw && YMD_RE.test(fromRaw) ? fromRaw : null;
  const to = toRaw && YMD_RE.test(toRaw) ? toRaw : null;

  const normRaw = pickString(raw, "norm");
  const norm: CompareNorm = (COMPARE_NORMS as readonly string[]).includes(
    normRaw,
  )
    ? (normRaw as CompareNorm)
    : DEFAULT_COMPARE_STATE.norm;

  return { ids, period, from, to, norm };
}

function pickString(
  raw: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = raw[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

/**
 * 現在の状態を URL クエリ文字列に encode (default 値は省略)。
 * 例: { ids: ["a","b"], period: "1y", norm: "zscore" } → "?ids=a,b&period=1y&norm=zscore"
 */
export function serializeCompareQuery(state: CompareState): string {
  const parts: string[] = [];
  if (state.ids.length > 0) {
    parts.push(`ids=${encodeURIComponent(state.ids.join(","))}`);
  }
  if (state.period !== DEFAULT_COMPARE_STATE.period) {
    parts.push(`period=${state.period}`);
  }
  if (state.period === "custom") {
    if (state.from) parts.push(`from=${state.from}`);
    if (state.to) parts.push(`to=${state.to}`);
  }
  if (state.norm !== DEFAULT_COMPARE_STATE.norm) {
    parts.push(`norm=${state.norm}`);
  }
  return parts.length === 0 ? "" : `?${parts.join("&")}`;
}
