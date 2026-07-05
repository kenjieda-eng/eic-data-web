/**
 * 系列詳細ページ (SEO L2) 用のサマリー統計を計算する純関数。
 *
 * catalog の各系列に固有の indexable テキストを持たせるため、CSV の生ポイント列から
 * 収載期間・データ点数・最新値・期間最大/最小・1 年前比較を導出する。副作用なし、
 * SSR 専用の SeriesSummaryStats から呼ばれるが単体テスト可能な形に切り出してある。
 *
 * 入力の points は fetchSeries が返す時系列順 (古い→新しい) を前提とする。
 * value が非 null の点のみを対象とし、有効点が 0 なら null を返す。
 */
import type { SeriesPoint } from "./series";

export interface SeriesStatPoint {
  date: string;
  value: number;
}

export interface SeriesYearAgo {
  date: string;
  value: number;
  /** (latest − yearAgo) / |yearAgo| × 100。yearAgo.value が 0 のときは null。 */
  changePct: number | null;
}

export interface SeriesStats {
  start: string;
  end: string;
  count: number;
  latest: SeriesStatPoint;
  max: SeriesStatPoint;
  min: SeriesStatPoint;
  yearAgo?: SeriesYearAgo;
}

type ValidPoint = { date: string; value: number };

/** "YYYY-MM-DD" → UTC epoch からの日数。解釈できない場合は null。 */
function ymdToDays(date: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 86_400_000);
}

/** latest の "YYYY-MM" から 12 ヶ月前と同じ年月 (= 前年同月) を返す。 */
function yearMonthOneYearBefore(date: string): string | null {
  const m = /^(\d{4})-(\d{2})/.exec(date);
  if (!m) return null;
  return `${Number(m[1]) - 1}-${m[2]}`;
}

function changePctOf(latest: number, yearAgo: number): number | null {
  if (yearAgo === 0) return null;
  return ((latest - yearAgo) / Math.abs(yearAgo)) * 100;
}

/**
 * frequency 別に「1 年前」の点を選ぶ。
 *   - annual        : latest の 1 つ前の非 null 点
 *   - monthly/quarterly : latest の前年同月と一致する点
 *   - daily         : latest から 365 日前に最も近い点 (±7 日以内に無ければ省略)
 *   - それ以外       : 省略
 */
function pickYearAgo(
  valid: ValidPoint[],
  frequency: string,
): ValidPoint | null {
  const latest = valid[valid.length - 1];

  if (frequency === "annual") {
    return valid.length >= 2 ? valid[valid.length - 2] : null;
  }

  if (frequency === "monthly" || frequency === "quarterly") {
    const targetYm = yearMonthOneYearBefore(latest.date);
    if (!targetYm) return null;
    return valid.find((p) => p.date.slice(0, 7) === targetYm) ?? null;
  }

  if (frequency === "daily") {
    const latestDays = ymdToDays(latest.date);
    if (latestDays === null) return null;
    const targetDays = latestDays - 365;
    let best: ValidPoint | null = null;
    let bestDiff = Infinity;
    for (const p of valid) {
      const days = ymdToDays(p.date);
      if (days === null) continue;
      const diff = Math.abs(days - targetDays);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = p;
      }
    }
    return bestDiff <= 7 ? best : null;
  }

  return null;
}

export function computeSeriesStats(
  points: SeriesPoint[],
  frequency: string,
): SeriesStats | null {
  const valid: ValidPoint[] = [];
  for (const p of points) {
    if (p.value !== null && Number.isFinite(p.value)) {
      valid.push({ date: p.date, value: p.value });
    }
  }
  if (valid.length === 0) return null;

  const latest = valid[valid.length - 1];

  // max/min は最初に出現した極値 (同値なら先勝ち → 厳密比較で更新)。
  let max = valid[0];
  let min = valid[0];
  for (const p of valid) {
    if (p.value > max.value) max = p;
    if (p.value < min.value) min = p;
  }

  const stats: SeriesStats = {
    start: valid[0].date,
    end: latest.date,
    count: valid.length,
    latest: { date: latest.date, value: latest.value },
    max: { date: max.date, value: max.value },
    min: { date: min.date, value: min.value },
  };

  const ya = pickYearAgo(valid, frequency);
  if (ya) {
    stats.yearAgo = {
      date: ya.date,
      value: ya.value,
      changePct: changePctOf(latest.value, ya.value),
    };
  }

  return stats;
}
