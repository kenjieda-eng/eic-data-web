/**
 * GET /api/indicator/<id> — 個別 indicator JSON 公開 API (CORS 有効)
 *
 * Phase C Day 3 (2026-05-12) で実装。catalog メタデータ + 時系列データを
 * 1 リクエストで取得可能。Insight 引用時の `?from=2024-01&to=2024-12` で期間絞り込みも対応。
 *
 * レスポンス形式:
 *   {
 *     id, name, domain, frequency, unit, source_name, source_url,
 *     license, observation_cutoff, updated_at,
 *     data: [{ date: "2024-01", value: 9.32 }, ...]
 *   }
 *
 * Cache: ISR 24 時間 (revalidate = 86400)
 * CORS: 公開 API、認証不要
 */

import { fetchCatalog } from "@/lib/catalog";
import { fetchSeries } from "@/lib/series";
import {
  RATE_LIMITS,
  clientIpFrom,
  rateLimit,
  withRateLimitHeaders,
} from "@/lib/rate-limit";

export const revalidate = 86400; // 24 時間

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

function inRange(
  dateStr: string,
  from: string | null,
  to: string | null,
): boolean {
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: rawId } = await params;
  // .json 末尾は寛容に剥がす (curl /api/indicator/foo.json でも /api/indicator/foo でも同じ動作)
  const id = rawId.replace(/\.json$/, "");

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
    const indicator = catalog.indicators.find((i) => i.id === id);
    if (!indicator) {
      return Response.json(
        { error: "indicator not found", id },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let data: { date: string; value: number | null }[] = [];
    let seriesError: string | null = null;
    try {
      const { points } = await fetchSeries(id);
      data = points.filter((p) => inRange(p.date, from, to));
    } catch (e) {
      seriesError = e instanceof Error ? e.message : String(e);
    }

    return Response.json(
      {
        ...indicator,
        data,
        meta: {
          generated_at: new Date().toISOString(),
          schema: catalog.schema,
          catalog_version: catalog.version,
          range: { from, to, count: data.length },
          ...(seriesError ? { series_error: seriesError } : {}),
        },
      },
      {
        headers: withRateLimitHeaders(
          {
            ...CORS_HEADERS,
            "Cache-Control":
              "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
          rl,
        ),
      },
    );
  } catch (error) {
    return Response.json(
      {
        error: "Failed to fetch indicator",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}
