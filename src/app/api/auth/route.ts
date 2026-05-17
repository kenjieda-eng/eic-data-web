/**
 * /api/auth — N6 API 認証 (Token 発行 + validation)
 *
 * Phase C Day 5 午後第 4 弾 (2026-05-16) で実装。
 *
 * POST /api/auth
 *   Body: { email, agreedToTerms: true, scope?: "read"|"write" }
 *   Response: { ok, token, expiresAt, demo? }
 *
 * GET /api/auth?token=...
 *   Response: { ok, payload?, reason? }
 *
 * env (API_AUTH_SECRET) 未設定時は demo 秘密鍵で動作 (graceful degradation)、
 * レスポンスの demo:true で識別可能。本番運用時は Vercel Project Settings で設定。
 */

import { issueToken, validateToken } from "@/lib/api-auth";
import {
  RATE_LIMITS,
  clientIpFrom,
  rateLimit,
  withRateLimitHeaders,
} from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  // Token 発行はメール検証コストが高い + brute-force 抑止のため newsletter と同じ厳しめ枠
  const ip = clientIpFrom(request.headers);
  const rl = await rateLimit(ip, RATE_LIMITS.newsletter);
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
  const email = typeof obj.email === "string" ? obj.email : "";
  const agreed = obj.agreedToTerms === true;
  const scope = typeof obj.scope === "string" ? obj.scope : "read";

  const result = issueToken({ email, agreedToTerms: agreed, scope });
  return Response.json(result, {
    status: result.ok ? 200 : 400,
    headers: withRateLimitHeaders(CORS_HEADERS, rl),
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const result = validateToken(token);
  return Response.json(result, {
    status: result.ok ? 200 : 401,
    headers: CORS_HEADERS,
  });
}
