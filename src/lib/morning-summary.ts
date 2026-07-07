/**
 * 朝刊サマリー /today — Phase C Day 2 (2026-05-13) で確立
 *
 * 5 系列横断 (JEPX 東京 + WTI + USD/JPY + JGB 10y + 米 CPI) の前日比 + 解説で
 * エネルギー × 金融市場の朝の状態を 5 行でまとめる。FRED + ブルームバーグが
 * 日本語で扱わない領域をカバーする EIC Data の差別化機能。
 *
 * Phase C Day 2 では:
 *   - 型定義 (MorningSummary / MorningSummaryLine / TrendAlert)
 *   - 5/13-5/17 のリン編集長手書きサンプル原稿を MORNING_SUMMARIES に登録
 *   - getMorningSummary(date) / listMorningSummaryDates() / getNeighbors(date) ヘルパ
 *   - relatedInsightsForSummary(summary) で indicators フィールドから逆引き
 * を実装。Phase D-Day-Z で GitHub Actions cron + catalog 動的取得で運用化予定。
 */

import { INSIGHTS, type Insight } from "./insights";
import { MORNING_SUMMARIES } from "./morning-summary-data";

export type MorningEditor = "ハル" | "マコト" | "リン";

export interface MorningSummaryLine {
  /** catalog indicator ID (例: "jepx-spot-tokyo") */
  indicatorId: string;
  /** 表示ラベル (例: "JEPX 東京", "¥/kWh") */
  label: string;
  /** 単位 (例: "¥/kWh", "$/bbl", "%") */
  unit: string;
  /** 当日値 */
  value: number;
  /** 前日比 (絶対値、不明なら null) */
  dod: number | null;
  /** 前日比 (%、不明なら null) */
  dodPct: number | null;
  /** 編集軸 (ハル = エネ、マコト = 金融) */
  editor: MorningEditor;
  /** 200-400 字の解説文 */
  explanation: string;
  /**
   * この値の観測日 (YYYY-MM-DD)。pipeline 由来のみ設定。
   * 月次系列は最新月末日など、date と一致しないことがある。
   */
  dataDate?: string;
  /** 比較の種別ラベル ("前日比" | "前月比")。pipeline 由来のみ設定、未設定時は "前日比" 扱い。 */
  periodLabel?: string;
}

export interface TrendAlert {
  indicatorId: string;
  label: string;
  dodPct: number;
  message: string;
}

export interface MorningSummary {
  /** ISO 8601 YYYY-MM-DD */
  date: string;
  /** 曜日 (日本語、例: "水") */
  weekday: string;
  /** 週末版か否か (土日は簡易フォーマット) */
  weekend: boolean;
  /** 更新時刻 ISO 8601 (例: "2026-05-13T07:00:00+09:00") */
  generatedAt: string;
  /** 5 行サマリー */
  lines: MorningSummaryLine[];
  /** トレンドアラート (±3% 超過時、なしは空配列) */
  alerts: TrendAlert[];
  /** 関連 Insight slug 配列 (3-5 本、INSIGHTS から手動選定) */
  relatedInsightSlugs: string[];
  /** 週末まとめ or 来週展望 (週末版のみ、平日は null) */
  weekendNote: string | null;
  /**
   * pipeline nightly が生成した自動サマリーなら true。
   * 手動 (リン編集長の編集版) エントリでは undefined。
   */
  generated?: boolean;
}

const TREND_ALERT_THRESHOLD = 3.0;

/** 配列を ISO 日付で降順ソート (新しい順) */
function sortByDateDesc(dates: string[]): string[] {
  return [...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

/** 全ての朝刊日付を新しい順に列挙 */
export function listMorningSummaryDates(): string[] {
  return sortByDateDesc(Object.keys(MORNING_SUMMARIES));
}

/** 最新の朝刊日付 (アーカイブ最新、デフォルト /today で表示) */
export function getLatestMorningSummaryDate(): string | null {
  const all = listMorningSummaryDates();
  return all.length > 0 ? all[0] : null;
}

/** 指定日の朝刊を取得 (未登録は null) */
export function getMorningSummary(date: string): MorningSummary | null {
  return MORNING_SUMMARIES[date] ?? null;
}

/** ±3% 超過のトレンドアラートを線から自動抽出 (登録データに alerts: [] と入っている時のフォールバック) */
export function detectAlerts(lines: MorningSummaryLine[]): TrendAlert[] {
  const alerts: TrendAlert[] = [];
  for (const line of lines) {
    if (line.dodPct === null) continue;
    if (Math.abs(line.dodPct) >= TREND_ALERT_THRESHOLD) {
      alerts.push({
        indicatorId: line.indicatorId,
        label: line.label,
        dodPct: line.dodPct,
        message: `${line.label} ${line.dodPct > 0 ? "+" : ""}${line.dodPct.toFixed(2)}% ${
          line.dodPct > 0 ? "急騰" : "急落"
        }`,
      });
    }
  }
  return alerts;
}

export interface MorningNeighbors {
  prev: string | null;
  next: string | null;
}

/** 朝刊アーカイブの前後日付 (新しい順 = next が新しい、prev が古い、UI は ← 前日 / 翌日 → 表示) */
export function getMorningNeighbors(date: string): MorningNeighbors {
  const asc = listMorningSummaryDates().reverse(); // ascending
  const idx = asc.indexOf(date);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? asc[idx - 1] : null,
    next: idx < asc.length - 1 ? asc[idx + 1] : null,
  };
}

/** 関連 Insight 逆引き: 朝刊で言及した 5 系列に紐づく Insight を最大 5 本返す */
export function relatedInsightsForSummary(
  summary: MorningSummary,
  insights: Insight[] = INSIGHTS,
  limit = 5,
): Insight[] {
  // 1. summary.relatedInsightSlugs (リン編集長が手動選定した順) を優先
  const explicit = summary.relatedInsightSlugs
    .map((slug) => insights.find((i) => i.slug === slug))
    .filter((x): x is Insight => x !== undefined);
  if (explicit.length >= limit) return explicit.slice(0, limit);

  // 2. 不足分は 5 系列 indicatorId に対する tags / sources 一致で追加
  const targetTags = summary.lines.flatMap((l) => [
    l.indicatorId,
    l.label,
    l.unit,
  ]);
  const seen = new Set(explicit.map((i) => i.slug));
  for (const insight of insights) {
    if (seen.has(insight.slug)) continue;
    const haystack = [
      insight.title,
      insight.lede,
      insight.tags.join(" "),
      insight.sources.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    if (targetTags.some((t) => haystack.includes(t.toLowerCase()))) {
      explicit.push(insight);
      seen.add(insight.slug);
      if (explicit.length >= limit) break;
    }
  }
  return explicit.slice(0, limit);
}

/**
 * 主要関数: 指定日の朝刊サマリーを生成 (Server Component で呼び出す想定)
 *
 * Phase C Day 2 では静的データ (MORNING_SUMMARIES) を返すのみ。
 * Phase D-Day-Z 以降:
 *   - catalog 系列の前日値を fetch
 *   - リン編集長が前日夜に書いた解説原稿を MORNING_SUMMARIES に append
 *   - GitHub Actions cron で毎平日朝 7:00 JST 実行
 */
export async function generateMorningSummary(
  date: string,
): Promise<MorningSummary | null> {
  const summary = getMorningSummary(date);
  if (!summary) return null;
  // alerts が空でも線から自動抽出 (登録データを信頼するが、未設定時のフォールバック)
  if (summary.alerts.length === 0) {
    const detected = detectAlerts(summary.lines);
    if (detected.length > 0) {
      return { ...summary, alerts: detected };
    }
  }
  return summary;
}

/* ------------------------------------------------------------------ *
 * pipeline (eic-data-pipeline) 由来の自動生成朝刊を取得する fetch 層
 *
 * pipeline nightly が data/today/{latest,index,archive/*}.json を main に配信。
 * ここでは today-v1 スキーマを既存 MorningSummary 型へ純関数でアダプトし、
 * 取得失敗は全て null / [] で graceful に握りつぶす (呼び出し側で手動版へフォールバック)。
 * ------------------------------------------------------------------ */

const TODAY_DATA_BASE =
  "https://raw.githubusercontent.com/kenjieda-eng/eic-data-pipeline/main/data/today";

/** ISR 1 時間 — 毎朝 nightly 後の最初のアクセスで自動更新される */
const TODAY_REVALIDATE = 3600;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** pipeline today-v1 スキーマ (リモート JSON の 1 行) */
interface RemoteTodayLine {
  indicatorId: string;
  label: string;
  unit: string;
  dataDate?: string;
  value: number;
  prevDate?: string;
  prevValue?: number | null;
  diff: number | null;
  diffPct: number | null;
  periodLabel?: string;
  rangePosPct?: number | null;
  editor: string;
  explanation: string;
}

interface RemoteTodayAlert {
  indicatorId: string;
  label: string;
  diffPct: number;
  message: string;
}

/** pipeline today-v1 スキーマ (ルート) */
export interface RemoteTodaySummary {
  schema: string;
  date: string;
  weekday: string;
  weekend: boolean;
  generatedAt: string;
  lines: RemoteTodayLine[];
  alerts?: RemoteTodayAlert[];
  relatedInsights?: string[];
}

/** pipeline today-index-v1 スキーマ */
interface RemoteTodayIndex {
  schema: string;
  dates: string[];
}

/** pipeline の editor コード ("haru" | "makoto") を既存 MorningEditor へ写像 */
export function mapRemoteEditor(editor: string): MorningEditor {
  switch (editor) {
    case "haru":
    case "ハル":
      return "ハル";
    case "makoto":
    case "マコト":
      return "マコト";
    case "リン":
      return "リン";
    default:
      return "ハル";
  }
}

/**
 * pipeline today-v1 JSON → 既存 MorningSummary 型 (純関数)
 *   - diff → dod、diffPct → dodPct
 *   - editor "haru"/"makoto" → "ハル"/"マコト"
 *   - relatedInsights → relatedInsightSlugs
 *   - dataDate / periodLabel は optional でそのまま保持
 *   - generated: true を付与 (リモート由来の目印)
 */
export function adaptRemoteSummary(remote: RemoteTodaySummary): MorningSummary {
  const lines: MorningSummaryLine[] = remote.lines.map((l) => ({
    indicatorId: l.indicatorId,
    label: l.label,
    unit: l.unit,
    value: l.value,
    dod: l.diff ?? null,
    dodPct: l.diffPct ?? null,
    editor: mapRemoteEditor(l.editor),
    explanation: l.explanation,
    dataDate: l.dataDate,
    periodLabel: l.periodLabel,
  }));
  const alerts: TrendAlert[] = (remote.alerts ?? []).map((a) => ({
    indicatorId: a.indicatorId,
    label: a.label,
    dodPct: a.diffPct,
    message: a.message,
  }));
  return {
    date: remote.date,
    weekday: remote.weekday,
    weekend: remote.weekend,
    generatedAt: remote.generatedAt,
    lines,
    alerts,
    relatedInsightSlugs: remote.relatedInsights ?? [],
    weekendNote: null,
    generated: true,
  };
}

/** today-v1 の最低限の形状チェック (schema + lines 配列) */
function isRemoteTodaySummary(json: unknown): json is RemoteTodaySummary {
  if (typeof json !== "object" || json === null) return false;
  const o = json as Record<string, unknown>;
  return o.schema === "today-v1" && Array.isArray(o.lines);
}

/** 最新の自動生成朝刊を取得。失敗時 (ネットワーク / スキーマ不整合) は null */
export async function fetchLatestSummary(): Promise<MorningSummary | null> {
  try {
    const res = await fetch(`${TODAY_DATA_BASE}/latest.json`, {
      next: { revalidate: TODAY_REVALIDATE },
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (!isRemoteTodaySummary(json)) return null;
    return adaptRemoteSummary(json);
  } catch {
    return null;
  }
}

/** 自動生成朝刊の日付索引 (降順)。失敗時は空配列 */
export async function fetchArchiveIndex(): Promise<string[]> {
  try {
    const res = await fetch(`${TODAY_DATA_BASE}/index.json`, {
      next: { revalidate: TODAY_REVALIDATE },
    });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    if (
      typeof json !== "object" ||
      json === null ||
      !Array.isArray((json as RemoteTodayIndex).dates)
    ) {
      return [];
    }
    const dates = (json as RemoteTodayIndex).dates.filter(
      (d): d is string => typeof d === "string" && ISO_DATE_RE.test(d),
    );
    return sortByDateDesc(dates);
  } catch {
    return [];
  }
}

/** 指定日の自動生成朝刊 (archive/{date}.json)。無ければ / 失敗時は null */
export async function fetchArchiveSummary(
  date: string,
): Promise<MorningSummary | null> {
  if (!ISO_DATE_RE.test(date)) return null;
  try {
    const res = await fetch(`${TODAY_DATA_BASE}/archive/${date}.json`, {
      next: { revalidate: TODAY_REVALIDATE },
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (!isRemoteTodaySummary(json)) return null;
    return adaptRemoteSummary(json);
  } catch {
    return null;
  }
}
