/**
 * N8 (Day 6, 2026-05-17): /embed/<id> ウィジェット内で使う sparkline 生成 helper。
 * SVG path 文字列 + trend 判定だけのピュア関数なので、テスト可能なよう page から分離。
 */

import type { SeriesPoint } from "./series";

export interface Sparkline {
  path: string;
  min: number;
  max: number;
  last: number | null;
  first: number | null;
  trend: "up" | "down" | "flat" | "unknown";
  count: number;
}

export interface SparklineOptions {
  width?: number;
  height?: number;
  padding?: number;
  /** trend = "flat" と判定する相対変動の閾値 (default 0.005 = 0.5%) */
  flatThreshold?: number;
}

const DEFAULTS = { width: 360, height: 100, padding: 4, flatThreshold: 0.005 } as const;

export function buildSparkline(
  points: SeriesPoint[],
  options: SparklineOptions = {},
): Sparkline | null {
  const { width, height, padding, flatThreshold } = { ...DEFAULTS, ...options };
  const valued = points.filter((p): p is { date: string; value: number } => p.value !== null);
  if (valued.length === 0) return null;

  const ys = valued.map((p) => p.value);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / Math.max(1, valued.length - 1);
  const path = valued
    .map((p, i) => {
      const x = padding + i * stepX;
      const y = height - padding - ((p.value - min) / range) * (height - padding * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const first = valued[0].value;
  const last = valued[valued.length - 1].value;
  const delta = last - first;
  const rel = Math.abs(delta) / (Math.abs(first) || 1);
  let trend: Sparkline["trend"];
  if (valued.length < 2) {
    trend = "unknown";
  } else if (rel < flatThreshold) {
    trend = "flat";
  } else {
    trend = delta > 0 ? "up" : "down";
  }

  return { path, min, max, last, first, trend, count: valued.length };
}

export function formatEmbedNumber(n: number, unit: string): string {
  const formatted = Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(2);
  return unit ? `${formatted} ${unit}` : formatted;
}
