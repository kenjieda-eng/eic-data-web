/**
 * GET /api/catalog — 全件 catalog JSON 公開 API (CORS 有効)
 *
 * Phase C Day 3 (2026-05-12) で実装。研究者・記者・トレーディング会社が
 * curl + jq でメタデータを一括取得できる「引用インフラ」の入り口。
 *
 * Cache: ISR 1 時間 (revalidate = 3600)
 * CORS: Access-Control-Allow-Origin: * (公開 API、認証不要)
 */

import { fetchCatalog } from "@/lib/catalog";
import {
  RATE_LIMITS,
  clientIpFrom,
  rateLimit,
  withRateLimitHeaders,
} from "@/lib/rate-limit";

export const revalidate = 3600; // 1 時間

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const ip = clientIpFrom(request.headers);
  const rl = await rateLimit(ip, RATE_LIMITS.data);
  if (!rl.ok) {
    return Response.json(
      { error: "Too Many Requests", retryAfter: rl.retryAfter },
      { status: 429, headers: withRateLimitHeaders(CORS_HEADERS, rl) },
    );
  }

  try {
    const catalog = await fetchCatalog();
    return Response.json(catalog, {
      headers: withRateLimitHeaders(
        {
          ...CORS_HEADERS,
          "Cache-Control":
            "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        },
        rl,
      ),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to fetch catalog",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 502, headers: withRateLimitHeaders(CORS_HEADERS, rl) },
    );
  }
}
