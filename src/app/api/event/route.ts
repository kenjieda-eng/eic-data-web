/**
 * N11 POST /api/event — client から透明性カウンターを bump (Day 6 PM, 2026-05-17)
 *
 * Body: { kind: "csvDl" | "citeCopy" }
 *
 * - 個人特定情報は受け取らない (kind 以外のフィールドは無視)
 * - rate limit (data preset: 60/min/IP) で過剰送信を防止
 * - apiReq バケットはサーバ側で /api/{catalog,indicator/[id]} 内で bump されるので、
 *   ここでは client イベント 2 種 (csvDl + citeCopy) のみ受け付ける
 */

import {
  RATE_LIMITS,
  clientIpFrom,
  rateLimit,
  withRateLimitHeaders,
} from "@/lib/rate-limit";
import { bumpUsage, isValidBucket } from "@/lib/usage-stats";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const CLIENT_BUCKETS = new Set(["csvDl", "citeCopy"]);

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  const rl = await rateLimit(ip, RATE_LIMITS.data);
  if (!rl.ok) {
    return Response.json(
      { ok: false, error: `Too Many Requests (retry in ${rl.retryAfter}s)` },
      { status: 429, headers: withRateLimitHeaders(CORS_HEADERS, rl) },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400, headers: withRateLimitHeaders(CORS_HEADERS, rl) },
    );
  }

  const obj = (body ?? {}) as Record<string, unknown>;
  const kind = obj.kind;
  if (!isValidBucket(kind) || !CLIENT_BUCKETS.has(kind)) {
    return Response.json(
      { ok: false, error: "kind must be one of: csvDl, citeCopy" },
      { status: 400, headers: withRateLimitHeaders(CORS_HEADERS, rl) },
    );
  }

  bumpUsage(kind);
  return Response.json(
    { ok: true, recorded: kind },
    { status: 200, headers: withRateLimitHeaders(CORS_HEADERS, rl) },
  );
}
