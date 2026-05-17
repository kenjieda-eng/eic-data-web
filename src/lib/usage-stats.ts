/**
 * N11 透明性ダッシュボード用 in-memory counter (Day 6 PM, 2026-05-17)
 *
 * 公開可能な集計のみを保持する:
 *   - apiReq    : /api/catalog + /api/indicator/[id] への GET 回数
 *   - csvDl     : CSV ダウンロード回数 (client から /api/event 経由)
 *   - citeCopy  : 引用フォーマットコピー回数 (client から /api/event 経由)
 *
 * 個人特定情報 (IP / email / user-agent) は一切保持しない。
 *
 * 制限:
 *   - process-local Map なので Vercel の各 Lambda インスタンスごとに分離
 *   - スケールアウト時の合算は不可、デプロイで初期化される
 *   - Phase D Q1 で Upstash KV に移行 (本ファイルの API シグネチャは維持)
 *
 * 月次ローテーション:
 *   - 月 (YYYY-MM) をキーに混ぜているので、月跨ぎは自動で新月の counter が立ち上がる
 *   - 古い月の counter は GC されず残るが、in-memory なので Lambda 再起動で消える
 */

export type UsageBucket = "apiReq" | "csvDl" | "citeCopy";

export const USAGE_BUCKETS: readonly UsageBucket[] = ["apiReq", "csvDl", "citeCopy"];

export interface UsageSnapshot {
  /** snapshot 取得時の月 (Asia/Tokyo) */
  month: string;
  counts: Record<UsageBucket, number>;
  /** in-memory counter が起動した時刻 (デプロイ起点) */
  sinceIso: string;
  /** Phase D 移行で false → true になる予定 */
  persistent: false;
}

const counters = new Map<string, number>();
const startedAt = new Date();

function monthKeyJst(now: Date = new Date()): string {
  // Asia/Tokyo 固定で YYYY-MM を組み立てる (Vercel が UTC 起動でもズレない)
  const jstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const jst = new Date(jstMs);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function counterKey(bucket: UsageBucket, month: string): string {
  return `${month}:${bucket}`;
}

export function bumpUsage(bucket: UsageBucket, now: Date = new Date()): void {
  const key = counterKey(bucket, monthKeyJst(now));
  counters.set(key, (counters.get(key) ?? 0) + 1);
}

export function getUsageSnapshot(now: Date = new Date()): UsageSnapshot {
  const month = monthKeyJst(now);
  const counts: Record<UsageBucket, number> = { apiReq: 0, csvDl: 0, citeCopy: 0 };
  for (const b of USAGE_BUCKETS) {
    counts[b] = counters.get(counterKey(b, month)) ?? 0;
  }
  return {
    month,
    counts,
    sinceIso: startedAt.toISOString(),
    persistent: false,
  };
}

export function isValidBucket(s: unknown): s is UsageBucket {
  return typeof s === "string" && (USAGE_BUCKETS as readonly string[]).includes(s);
}

/** vitest 用にカウンターをリセット (production code からは呼ばない) */
export function _resetUsageCounters(): void {
  counters.clear();
}
