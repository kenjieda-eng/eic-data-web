/**
 * N7 API Rate Limit — Upstash Redis REST + in-memory fallback (Day 6 Phase C, 2026-05-17)
 *
 * - Fixed-window counter ("rl:<bucket>:<ip>:<window>")
 * - Upstash REST API 直接 fetch (deps 追加なし、@upstash/redis SDK は使わない)
 *   env: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * - env 未設定時は in-memory Map で graceful degradation (単一インスタンス内のみ有効)
 *   → preview/local では in-memory、本番 (Vercel) では Upstash を期待
 * - 戻り値: { ok, limit, remaining, reset, retryAfter }
 *
 * 設計ノート:
 *  - Edge runtime でも動くよう Node built-ins (crypto 等) は使わない
 *  - Upstash の REST は POST <URL>/pipeline でコマンド配列を一括実行
 *    → INCR と EXPIRE を 1 ラウンドトリップに集約
 *  - 429 時は Retry-After: <seconds> ヘッダを response 側で付与する
 *  - clientIp 取得は x-forwarded-for の先頭 / x-real-ip の順 (Vercel proxy 通過)
 */

export interface RateLimitConfig {
  /** ウィンドウ内に許可するリクエスト数 */
  limit: number;
  /** ウィンドウ長 (秒) */
  windowSec: number;
  /** バケット名 (data, newsletter, editor-notify 等の API グループ識別子) */
  bucket: string;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** ウィンドウ終了の epoch 秒 */
  reset: number;
  /** 429 時に Retry-After ヘッダに入れる秒数 */
  retryAfter: number;
  /** Upstash 通信失敗等で fallback 発動した場合 true */
  fallback?: boolean;
}

const memoryStore = new Map<string, { count: number; expiresAt: number }>();
let lastSweep = 0;

function sweepIfNeeded(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of memoryStore) {
    if (v.expiresAt <= now) memoryStore.delete(k);
  }
}

function memoryHit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  sweepIfNeeded(now);
  const entry = memoryStore.get(key);
  const windowMs = windowSec * 1000;
  if (!entry || entry.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return {
      ok: true,
      limit,
      remaining: limit - 1,
      reset: Math.floor((now + windowMs) / 1000),
      retryAfter: 0,
      fallback: true,
    };
  }
  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  const reset = Math.floor(entry.expiresAt / 1000);
  const ok = entry.count <= limit;
  return {
    ok,
    limit,
    remaining,
    reset,
    retryAfter: ok ? 0 : Math.max(1, Math.ceil((entry.expiresAt - now) / 1000)),
    fallback: true,
  };
}

interface UpstashEnv {
  url: string;
  token: string;
}

function readUpstashEnv(env: Record<string, string | undefined>): UpstashEnv | null {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

async function upstashPipeline(
  env: UpstashEnv,
  commands: (string | number)[][],
): Promise<unknown[] | null> {
  try {
    const res = await fetch(`${env.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ result?: unknown; error?: unknown }>;
    return json.map((entry) => entry.result ?? null);
  } catch {
    return null;
  }
}

/**
 * IP 抽出: Vercel/プロキシ経由を想定し x-forwarded-for の先頭を採用。
 * 取れない場合は "unknown" で fallback (= 全 anonymous リクエストが同バケットへ集約)。
 */
export function clientIpFrom(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
  env: Record<string, string | undefined> = process.env,
): Promise<RateLimitResult> {
  const window = Math.floor(Date.now() / 1000 / config.windowSec);
  const key = `rl:${config.bucket}:${identifier}:${window}`;
  const upstash = readUpstashEnv(env);
  if (!upstash) {
    return memoryHit(key, config.limit, config.windowSec);
  }

  const results = await upstashPipeline(upstash, [
    ["INCR", key],
    ["EXPIRE", key, config.windowSec],
  ]);
  if (!results || results.length < 1 || typeof results[0] !== "number") {
    return memoryHit(key, config.limit, config.windowSec);
  }
  const count = results[0];
  const windowEndsAt = (window + 1) * config.windowSec;
  const remaining = Math.max(0, config.limit - count);
  const ok = count <= config.limit;
  return {
    ok,
    limit: config.limit,
    remaining,
    reset: windowEndsAt,
    retryAfter: ok ? 0 : Math.max(1, windowEndsAt - Math.floor(Date.now() / 1000)),
  };
}

/**
 * Standard ヘッダを付与した Response を組み立てる helper。
 * 429 時は Retry-After、それ以外は X-RateLimit-* を返す。
 */
export function withRateLimitHeaders(
  base: Record<string, string>,
  rl: RateLimitResult,
): Record<string, string> {
  const headers: Record<string, string> = {
    ...base,
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(rl.reset),
  };
  if (!rl.ok) headers["Retry-After"] = String(rl.retryAfter);
  return headers;
}

/** 共通: 既定の bucket プリセット (本プロジェクトで使う 3 種) */
export const RATE_LIMITS = {
  data: { bucket: "data", limit: 60, windowSec: 60 },
  newsletter: { bucket: "newsletter", limit: 5, windowSec: 60 },
  editorNotify: { bucket: "editor-notify", limit: 10, windowSec: 3600 },
} as const satisfies Record<string, RateLimitConfig>;

export const _internal = { memoryStore };
