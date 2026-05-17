/**
 * N11 GET /api/usage-stats — 公開可能な集計のみを返す (Day 6 PM, 2026-05-17)
 *
 * 透明性ダッシュボード /usage-stats のデータソース。
 * 個人特定情報 (IP / email / user-agent) は一切返さない。
 *
 * 集計対象 (UsageBucket):
 *   - apiReq    : /api/catalog + /api/indicator/[id] への GET 回数
 *   - csvDl     : CSV ダウンロード回数 (client から POST /api/event 経由)
 *   - citeCopy  : 引用フォーマットコピー回数 (client から POST /api/event 経由)
 *
 * Phase D Q1 で in-memory → Upstash KV に移行 (persistent: true で識別可)。
 */

import { getUsageSnapshot } from "@/lib/usage-stats";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const snapshot = getUsageSnapshot();
  return Response.json(snapshot, {
    headers: {
      ...CORS_HEADERS,
      // 1 分キャッシュ: 透明性ダッシュボードはほぼリアルタイムだが
      // CDN のヒット率を上げて Vercel コスト削減
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
