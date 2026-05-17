/**
 * POST /api/editor-notify — N3 編集者通知 (Resend 連携)
 *
 * Phase C Day 5 午後第 3 弾 (2026-05-16) で実装。
 * Body: { slug: string }
 * Response: EditorNotifyResult (notified が false でも 200、env 未設定/未マッチ理由を error に明記)
 */

import { INSIGHTS } from "@/lib/insights";
import {
  getInsightForNotification,
  sendEditorNotification,
  type EditorNotifyResult,
} from "@/lib/editor-notification";
import {
  RATE_LIMITS,
  clientIpFrom,
  rateLimit,
  withRateLimitHeaders,
} from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  const rl = await rateLimit(ip, RATE_LIMITS.editorNotify);
  if (!rl.ok) {
    return Response.json(
      {
        ok: false,
        notified: false,
        recipients: [],
        error: `Too Many Requests (retry in ${rl.retryAfter}s)`,
      } satisfies EditorNotifyResult,
      { status: 429, headers: withRateLimitHeaders(CORS_HEADERS, rl) },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        notified: false,
        recipients: [],
        error: "Invalid JSON body",
      } satisfies EditorNotifyResult,
      { status: 400, headers: withRateLimitHeaders(CORS_HEADERS, rl) },
    );
  }

  const obj = (body ?? {}) as Record<string, unknown>;
  const slug = typeof obj.slug === "string" ? obj.slug.trim() : "";
  if (!slug) {
    return Response.json(
      {
        ok: false,
        notified: false,
        recipients: [],
        error: "slug is required",
      } satisfies EditorNotifyResult,
      { status: 400, headers: withRateLimitHeaders(CORS_HEADERS, rl) },
    );
  }

  const insight = getInsightForNotification(slug);
  if (!insight) {
    return Response.json(
      {
        ok: false,
        notified: false,
        recipients: [],
        error: `Insight slug not found: ${slug}`,
      } satisfies EditorNotifyResult,
      { status: 404, headers: withRateLimitHeaders(CORS_HEADERS, rl) },
    );
  }

  const insightIndex = INSIGHTS.findIndex((i) => i.slug === slug) + 1;
  const result = await sendEditorNotification(insight, insightIndex);

  return Response.json(
    {
      ok: true,
      notified: result.sent,
      recipients: result.recipients,
      insight,
      error: result.sent ? undefined : result.reason,
    } satisfies EditorNotifyResult,
    { status: 200, headers: withRateLimitHeaders(CORS_HEADERS, rl) },
  );
}
