/**
 * /watch (マーケットビュー) 用の KPI データ構築ヘルパ
 *
 * 12 主要 KPI を 1 ページで俯瞰するために、SSG/ISR 時に Server Component から呼ばれる:
 *   - WATCH_KPIS: 12 KPI 定義 (id + 表示ラベル + 単位上書き + カテゴリ)
 *   - buildKpi(): 系列の直近値 + 前期比 + sparkline (直近 N 点) を構築
 *   - averageSeries(): 複数系列の月次平均 (JEPX 全国平均など、catalog に存在しない指標を派生で作る)
 *
 * すべて純粋関数 (副作用なし)。テストで網羅。
 */
import type { SeriesPoint } from "./series";

export type WatchCategory = "電力" | "燃料" | "金融" | "需要・電源";

export interface WatchKpiDef {
  /** catalog の indicator id、もしくは派生指標の場合は "derived:xxx" */
  id: string;
  /** 表示用ラベル (短く) */
  label: string;
  /** 表示用単位 (catalog の unit を override する場合のみ) */
  unitOverride?: string;
  /** カテゴリ別の枠線色 */
  category: WatchCategory;
  /** 派生指標の場合、元になる series id のリスト (JEPX 9 エリア → 全国平均など) */
  derivedFrom?: string[];
}

/**
 * 12 主要 KPI (3 行 × 4 列レスポンシブ):
 *   電力 6: JEPX 東京 / 関西 / 九州 / 北海道 / 中部 / 全国平均 (9 エリア mean)
 *   燃料 2: LNG-JP CIF / Brent
 *   金融 2: USD/JPY / JGB 10y
 *   需要・電源 2: 販売電力量 / 太陽光発電量
 */
export const JEPX_9_REGION_IDS = [
  "jepx-spot-hokkaido",
  "jepx-spot-tohoku",
  "jepx-spot-tokyo",
  "jepx-spot-chubu",
  "jepx-spot-hokuriku",
  "jepx-spot-kansai",
  "jepx-spot-chugoku",
  "jepx-spot-shikoku",
  "jepx-spot-kyushu",
] as const;

export const WATCH_KPIS: WatchKpiDef[] = [
  { id: "jepx-spot-tokyo", label: "JEPX 東京", category: "電力" },
  { id: "jepx-spot-kansai", label: "JEPX 関西", category: "電力" },
  { id: "jepx-spot-kyushu", label: "JEPX 九州", category: "電力" },
  { id: "jepx-spot-hokkaido", label: "JEPX 北海道", category: "電力" },
  { id: "jepx-spot-chubu", label: "JEPX 中部", category: "電力" },
  {
    id: "derived:jepx-9-region-avg",
    label: "JEPX 全国平均",
    unitOverride: "¥/kWh",
    category: "電力",
    derivedFrom: [...JEPX_9_REGION_IDS],
  },
  { id: "fuel-lng-jp-cif", label: "LNG-JP CIF", category: "燃料" },
  { id: "fuel-crude-brent", label: "Brent 原油", category: "燃料" },
  { id: "fx-usdjpy-monthly-avg", label: "USD/JPY", category: "金融" },
  { id: "jgb-10y-yield", label: "JGB 10 年", category: "金融" },
  { id: "meti-demand-total", label: "販売電力量 (全国)", category: "需要・電源" },
  { id: "meti-gen-solar", label: "太陽光発電量 (全国)", category: "需要・電源" },
];

export const WATCH_CATEGORY_COLORS: Record<WatchCategory, string> = {
  電力: "#10b981", // emerald-500
  燃料: "#f97316", // orange-500
  金融: "#eab308", // yellow-500
  "需要・電源": "#8b5cf6", // violet-500
};

export interface SparklinePoint {
  date: string;
  value: number;
}

export interface Kpi {
  id: string;
  label: string;
  unit: string;
  category: WatchCategory;
  /** 直近観測点 (value=null は除外) */
  last: { date: string; value: number } | null;
  /** 前観測点 (差分計算用) */
  prev: { date: string; value: number } | null;
  /** 前期比 (絶対値) */
  delta: number | null;
  /** 前期比 (%) */
  deltaPct: number | null;
  /** 直近 N 点 (sparkline 描画用) */
  sparkline: SparklinePoint[];
  source: { name: string; url: string } | null;
  observationCutoff: string | null;
}

/** 直近 N 点の non-null 値を取り出す (時系列順を保持) */
export function takeRecentValid(
  points: SeriesPoint[],
  n: number,
): SparklinePoint[] {
  const valid: SparklinePoint[] = [];
  for (let i = points.length - 1; i >= 0 && valid.length < n; i--) {
    const p = points[i];
    if (p.value !== null && Number.isFinite(p.value)) {
      valid.push({ date: p.date, value: p.value });
    }
  }
  return valid.reverse();
}

/**
 * 系列から KPI 1 件を構築。
 * sparkN は sparkline の点数 (デフォルト 7)。
 */
export function buildKpi(args: {
  def: WatchKpiDef;
  points: SeriesPoint[];
  unit: string;
  sourceName?: string;
  sourceUrl?: string;
  observationCutoff?: string;
  sparkN?: number;
}): Kpi {
  const { def, points, unit, sourceName, sourceUrl, observationCutoff } = args;
  const sparkN = args.sparkN ?? 7;
  const recent = takeRecentValid(points, sparkN);

  const last = recent.length > 0 ? recent[recent.length - 1] : null;
  const prev = recent.length > 1 ? recent[recent.length - 2] : null;

  const delta =
    last && prev ? last.value - prev.value : null;
  const deltaPct =
    last && prev && prev.value !== 0
      ? ((last.value - prev.value) / Math.abs(prev.value)) * 100
      : null;

  return {
    id: def.id,
    label: def.label,
    unit: def.unitOverride ?? unit,
    category: def.category,
    last,
    prev,
    delta,
    deltaPct,
    sparkline: recent,
    source: sourceName && sourceUrl ? { name: sourceName, url: sourceUrl } : null,
    observationCutoff: observationCutoff ?? null,
  };
}

/**
 * 複数の月次系列を月キー (YYYY-MM) で揃え、共通月のみで mean を取った派生系列を返す。
 * JEPX 9 エリア → 全国平均などに使う。
 *
 * 入力は { id, points } の配列。すべての id で観測がある月だけ採用 (intersection)、
 * mean は単純平均。重み付けは将来課題。
 */
export function averageSeries(
  inputs: { id: string; points: SeriesPoint[] }[],
): SeriesPoint[] {
  if (inputs.length === 0) return [];

  // 各系列を「ym → value」の Map に変換 (null 除外)
  const maps = inputs.map(({ points }) => {
    const m = new Map<string, number>();
    for (const p of points) {
      if (p.value === null || !Number.isFinite(p.value)) continue;
      m.set(p.date.slice(0, 7), p.value);
    }
    return m;
  });

  // 共通月 (intersection) を取り出して mean を計算
  if (maps[0].size === 0) return [];
  const commonMonths = [...maps[0].keys()].filter((ym) =>
    maps.every((m) => m.has(ym)),
  );
  commonMonths.sort();

  return commonMonths.map((ym) => {
    const sum = maps.reduce((s, m) => s + (m.get(ym) as number), 0);
    return { date: `${ym}-15`, value: sum / maps.length };
  });
}

/** 表示用整形: delta の符号 + 小数桁 */
export function formatDelta(
  delta: number | null,
  digits = 2,
): { sign: "+" | "-" | "0"; text: string } {
  if (delta === null || !Number.isFinite(delta)) return { sign: "0", text: "—" };
  if (delta === 0) return { sign: "0", text: "0" };
  const sign: "+" | "-" = delta > 0 ? "+" : "-";
  const abs = Math.abs(delta).toLocaleString("ja-JP", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
  return { sign, text: `${sign}${abs}` };
}

/** 表示用整形: deltaPct の符号 + 1 桁小数 + "%" */
export function formatDeltaPct(deltaPct: number | null): {
  sign: "+" | "-" | "0";
  text: string;
} {
  if (deltaPct === null || !Number.isFinite(deltaPct))
    return { sign: "0", text: "—" };
  if (deltaPct === 0) return { sign: "0", text: "0%" };
  const sign: "+" | "-" = deltaPct > 0 ? "+" : "-";
  const abs = Math.abs(deltaPct).toFixed(1);
  return { sign, text: `${sign}${abs}%` };
}

/**
 * sparkline の SVG 用 path 座標を計算。
 * viewBox は (0, 0)-(width, height)。
 * 値域に余白 8% 取り、最小値を底に、最大値を上に寄せる。
 */
export function computeSparklinePath(
  points: SparklinePoint[],
  width: number,
  height: number,
): { path: string; lastX: number | null; lastY: number | null } {
  if (points.length === 0) return { path: "", lastX: null, lastY: null };
  if (points.length === 1) {
    const x = width / 2;
    const y = height / 2;
    return { path: `M ${x} ${y}`, lastX: x, lastY: y };
  }

  const values = points.map((p) => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const padV = (maxV - minV) * 0.08 || 1;
  const lo = minV - padV;
  const hi = maxV + padV;
  const span = hi - lo;

  const n = points.length;
  const stepX = n > 1 ? width / (n - 1) : 0;

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p.value - lo) / span) * height;
    return { x, y };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(" ");

  const lastCoord = coords[coords.length - 1];
  return { path, lastX: lastCoord.x, lastY: lastCoord.y };
}
