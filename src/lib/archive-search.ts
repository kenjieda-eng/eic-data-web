/**
 * 朝刊アーカイブ検索 (/today/archive 用) — 5/13 Day 5
 *
 * MORNING_SUMMARIES (現在 5 日分、Phase D で毎平日 7:00 JST cron で append される) を
 * キーワード + 日付範囲で絞り込み、月次グルーピング + 200 字抜粋を生成する純粋関数群。
 *
 * morning-summary.ts は (1) 個別取得 + 関連 Insight 逆引き、本 lib は (2) 検索 + 集計の責務分離。
 */
import type { MorningSummary } from "./morning-summary";
import { MORNING_SUMMARIES } from "./morning-summary-data";

export interface ArchiveSearchFilters {
  query: string;
  fromDate: string | null; // YYYY-MM-DD (含む)
  toDate: string | null; // YYYY-MM-DD (含む)
}

export const EMPTY_ARCHIVE_FILTERS: ArchiveSearchFilters = {
  query: "",
  fromDate: null,
  toDate: null,
};

/** 朝刊全件を新しい順 (降順) で取得 */
export function listAllSummaries(
  data: Record<string, MorningSummary> = MORNING_SUMMARIES,
): MorningSummary[] {
  return Object.values(data).sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
}

/** 朝刊 1 件のテキスト本文を結合 (検索用 haystack) */
export function summaryHaystack(summary: MorningSummary): string {
  const parts: string[] = [summary.date, summary.weekday];
  for (const line of summary.lines) {
    parts.push(line.label, line.unit, line.explanation);
  }
  if (summary.weekendNote) parts.push(summary.weekendNote);
  return parts.join(" ").toLowerCase();
}

/** キーワード + 日付範囲で絞り込み (AND) */
export function filterSummaries(
  summaries: MorningSummary[],
  filters: ArchiveSearchFilters,
): MorningSummary[] {
  const q = filters.query.trim().toLowerCase();
  return summaries.filter((s) => {
    if (filters.fromDate && s.date < filters.fromDate) return false;
    if (filters.toDate && s.date > filters.toDate) return false;
    if (q) {
      if (!summaryHaystack(s).includes(q)) return false;
    }
    return true;
  });
}

export interface MonthGroup {
  month: string; // YYYY-MM
  summaries: MorningSummary[];
}

/** YYYY-MM 単位でグルーピング (月キーは降順) */
export function groupByMonth(summaries: MorningSummary[]): MonthGroup[] {
  const map = new Map<string, MorningSummary[]>();
  for (const s of summaries) {
    const ym = s.date.slice(0, 7);
    const list = map.get(ym) ?? [];
    list.push(s);
    map.set(ym, list);
  }
  return [...map.entries()]
    .map(([month, list]) => ({
      month,
      summaries: list.sort((a, b) => (a.date < b.date ? 1 : -1)),
    }))
    .sort((a, b) => (a.month < b.month ? 1 : -1));
}

/** 200 字抜粋 (query があれば前後 80 字を切り出し、なければ先頭) */
export function summarySnippet(
  summary: MorningSummary,
  query: string,
  length = 200,
): string {
  const allText = summary.lines.map((l) => l.explanation).join(" ／ ");
  const q = query.trim();
  if (!q) {
    return truncate(allText, length);
  }
  const lower = allText.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return truncate(allText, length);
  const half = Math.floor(length / 2);
  const start = Math.max(0, idx - half);
  const end = Math.min(allText.length, start + length);
  const out = allText.slice(start, end);
  return (start > 0 ? "…" : "") + out + (end < allText.length ? "…" : "");
}

function truncate(s: string, length: number): string {
  if (s.length <= length) return s;
  return s.slice(0, length) + "…";
}

/** 朝刊サマリーの 1 行目 (主要指標) の見出し化 — 「JEPX 東京 +1.97% 9.32 ¥/kWh」形式 */
export function summaryHeadline(summary: MorningSummary): string {
  const first = summary.lines[0];
  if (!first) return summary.date;
  const sign =
    first.dodPct === null
      ? ""
      : first.dodPct >= 0
        ? `+${first.dodPct.toFixed(2)}%`
        : `${first.dodPct.toFixed(2)}%`;
  return `${first.label} ${sign} ${first.value} ${first.unit}`.trim();
}

/** 月ラベル (YYYY-MM → "2026 年 5 月") */
export function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  if (!y || !m) return month;
  return `${y} 年 ${parseInt(m, 10)} 月`;
}

/** ISO date 妥当性チェック (YYYY-MM-DD) */
export function isValidIsoDate(s: string | null): boolean {
  if (!s) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
