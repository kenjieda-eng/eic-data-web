/**
 * /playground (データ実験ノートブック) の操作カタログ + 純粋関数群
 *
 * UI 操作のみでカタログ系列を組み合わせて相関 / ラグ / 移動平均 / Z-score / 対数差分を
 * 即時計算する。Server-side 評価はしない (CSR で完結) ため、すべて型安全な純粋関数。
 *
 * 既存ヘルパとの関係:
 *   - pearsonCorrelation, aggregateMonthly, shiftMonths, alignMonthly は再利用 (derived.ts / series-batch.ts)
 *   - normalize (compare-helpers) の zscore とは別実装にした (UI 互換性: null を保持 + 0 除算 0 フォールバック)
 */
import { pearsonCorrelation } from "./derived";
import type { SeriesPoint } from "./series";
import {
  aggregateMonthly,
  alignMonthly,
  shiftMonths,
} from "./series-batch";

export const PLAYGROUND_OPS = [
  "correlation",
  "lag",
  "ma",
  "zscore",
  "logdiff",
] as const;
export type PlaygroundOp = (typeof PLAYGROUND_OPS)[number];

export const PLAYGROUND_OP_LABELS: Record<PlaygroundOp, string> = {
  correlation: "ピアソン相関 r (月次)",
  lag: "ラグ相関スイープ (0〜N ヶ月)",
  ma: "移動平均 (窓サイズ可変)",
  zscore: "Z-score 標準化",
  logdiff: "対数差分 (前期比 log)",
};

export const PLAYGROUND_OP_HELP: Record<PlaygroundOp, string> = {
  correlation:
    "2 系列の月次共通月でピアソン r を計算。+1 = 完全同調、0 = 無相関、-1 = 反相関",
  lag:
    "A を 0〜N ヶ月先行させた時の B との相関を全 N+1 通り計算。ピークラグで因果伝播の遅延を読む",
  ma:
    "直近 W 点の単純平均で時系列を平滑化。W=3/6/12 でトレンド成分を視覚化",
  zscore:
    "(x - μ) / σ で平均 0 / 標準偏差 1 に標準化。単位の異なる系列を 1 軸で比較可能に",
  logdiff:
    "ln(x_t) - ln(x_{t-1}) で対数差分 ≈ 連続複利の前期比 %。値が 0 以下の点は null",
};

export type PlaygroundParams = {
  /** ラグスイープの最大月数 */
  maxLag: number;
  /** 移動平均の窓サイズ */
  maWindow: number;
};

export const DEFAULT_PLAYGROUND_PARAMS: PlaygroundParams = {
  maxLag: 12,
  maWindow: 6,
};

export interface LagSweepPoint {
  lagMonths: number;
  r: number;
}

/**
 * A を 0〜maxLag ヶ月先行させ、B との月次相関を全通り計算。
 * shiftMonths で時系列をずらした上で pearsonCorrelation を取る。
 *
 * 入力は日次 / 月次どちらでも (内部で aggregateMonthly + alignMonthly)。
 * r === null (3 点未満 or 分散ゼロ) のラグはスキップ。
 */
export function computeLagSweep(
  a: SeriesPoint[],
  b: SeriesPoint[],
  maxLag: number,
): LagSweepPoint[] {
  const aMonthly = aggregateMonthly(a);
  const bMonthly = aggregateMonthly(b);
  const out: LagSweepPoint[] = [];
  for (let m = 0; m <= maxLag; m++) {
    const shifted = shiftMonths(aMonthly, m);
    const r = pearsonCorrelation(shifted, bMonthly);
    if (r === null) continue;
    out.push({ lagMonths: m, r });
  }
  return out;
}

/** ラグスイープから |r| 最大のピークを返す (空入力なら null) */
export function pickLagPeak(results: LagSweepPoint[]): LagSweepPoint | null {
  if (results.length === 0) return null;
  let peak = results[0];
  for (const p of results) {
    if (Math.abs(p.r) > Math.abs(peak.r)) peak = p;
  }
  return peak;
}

/**
 * 単純移動平均 (窓 = window 点)。窓に満たない先頭は null。
 * 窓内に null が 1 つでもあれば null (見かけ上の平均で精度が下がるのを避ける)。
 */
export function movingAverage(
  points: SeriesPoint[],
  window: number,
): SeriesPoint[] {
  if (window < 1) return points;
  const out: SeriesPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i < window - 1) {
      out.push({ date: points[i].date, value: null });
      continue;
    }
    const slice = points.slice(i - window + 1, i + 1);
    let sum = 0;
    let ok = true;
    for (const p of slice) {
      if (p.value === null || !Number.isFinite(p.value)) {
        ok = false;
        break;
      }
      sum += p.value;
    }
    out.push({
      date: points[i].date,
      value: ok ? sum / window : null,
    });
  }
  return out;
}

/**
 * Z-score 標準化: (x - μ) / σ。
 * null は null のまま保持。値域が単一値 (σ=0) なら全 0、空入力なら入力そのまま。
 */
export function zscoreSeries(points: SeriesPoint[]): SeriesPoint[] {
  if (points.length === 0) return points;
  const vals: number[] = [];
  for (const p of points) {
    if (p.value !== null && Number.isFinite(p.value)) vals.push(p.value);
  }
  if (vals.length === 0) return points;
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const variance =
    vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
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

/**
 * 対数差分 (連続複利の前期比 ≒ %): ln(x_t) - ln(x_{t-1})。
 * x_t または x_{t-1} が 0 以下 or null なら null。
 * 系列の長さは入力と同じ、先頭は null。
 */
export function logDiffSeries(points: SeriesPoint[]): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (i === 0) {
      out.push({ date: p.date, value: null });
      continue;
    }
    const prev = points[i - 1];
    if (
      p.value === null ||
      prev.value === null ||
      p.value <= 0 ||
      prev.value <= 0 ||
      !Number.isFinite(p.value) ||
      !Number.isFinite(prev.value)
    ) {
      out.push({ date: p.date, value: null });
      continue;
    }
    out.push({
      date: p.date,
      value: Math.log(p.value) - Math.log(prev.value),
    });
  }
  return out;
}

/**
 * 単一系列の操作 (ma / zscore / logdiff) を分岐実行。
 * correlation / lag は別関数 (2 系列必要なので入出力型が違う) で扱う。
 */
export function applySingleOp(
  points: SeriesPoint[],
  op: "ma" | "zscore" | "logdiff",
  params: PlaygroundParams,
): SeriesPoint[] {
  switch (op) {
    case "ma":
      return movingAverage(points, params.maWindow);
    case "zscore":
      return zscoreSeries(points);
    case "logdiff":
      return logDiffSeries(points);
  }
}

// =============================================================================
// URL クエリ ↔ 状態のシリアライズ
// =============================================================================

export interface PlaygroundState {
  a: string | null;
  b: string | null;
  op: PlaygroundOp;
  maxLag: number;
  maWindow: number;
}

export const DEFAULT_PLAYGROUND_STATE: PlaygroundState = {
  a: null,
  b: null,
  op: "correlation",
  maxLag: 12,
  maWindow: 6,
};

const MA_WINDOWS = [3, 6, 12] as const;

export function parsePlaygroundQuery(
  raw: Record<string, string | string[] | undefined>,
): PlaygroundState {
  const a = pickString(raw, "a") || null;
  const b = pickString(raw, "b") || null;

  const opRaw = pickString(raw, "op");
  const op: PlaygroundOp = (PLAYGROUND_OPS as readonly string[]).includes(opRaw)
    ? (opRaw as PlaygroundOp)
    : DEFAULT_PLAYGROUND_STATE.op;

  const lagRaw = parseInt(pickString(raw, "lag"), 10);
  const maxLag =
    Number.isFinite(lagRaw) && lagRaw >= 1 && lagRaw <= 24
      ? lagRaw
      : DEFAULT_PLAYGROUND_STATE.maxLag;

  const maRaw = parseInt(pickString(raw, "ma"), 10);
  const maWindow = (MA_WINDOWS as readonly number[]).includes(maRaw)
    ? maRaw
    : DEFAULT_PLAYGROUND_STATE.maWindow;

  return { a, b, op, maxLag, maWindow };
}

function pickString(
  raw: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = raw[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

/** default 値は省略して URL を短くする */
export function serializePlaygroundQuery(state: PlaygroundState): string {
  const parts: string[] = [];
  if (state.a) parts.push(`a=${encodeURIComponent(state.a)}`);
  if (state.b) parts.push(`b=${encodeURIComponent(state.b)}`);
  if (state.op !== DEFAULT_PLAYGROUND_STATE.op) parts.push(`op=${state.op}`);
  if (state.op === "lag" && state.maxLag !== DEFAULT_PLAYGROUND_STATE.maxLag) {
    parts.push(`lag=${state.maxLag}`);
  }
  if (state.op === "ma" && state.maWindow !== DEFAULT_PLAYGROUND_STATE.maWindow) {
    parts.push(`ma=${state.maWindow}`);
  }
  return parts.length === 0 ? "" : `?${parts.join("&")}`;
}

/** op に応じて必要な系列数 (1 or 2) を返す */
export function requiredSeriesCount(op: PlaygroundOp): 1 | 2 {
  return op === "correlation" || op === "lag" ? 2 : 1;
}
