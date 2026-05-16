/**
 * POST /api/newsletter — Tier 2 ニュースレター購読登録
 *
 * Phase C Day 5 午後タスク 3 (2026-05-16) で実装。
 * - email 形式バリデーション (400)
 * - UTM パラメータ (source/medium/campaign) を任意で受信
 * - Resend API キー (RESEND_API_KEY) があれば welcome メール送信、
 *   なければ購読データのみ返却 (emailSent: false)
 *
 * CORS: Access-Control-Allow-Origin: * (公開 API)
 */

import {
  buildSubscription,
  isValidEmail,
  sanitizeUtm,
  sendWelcomeEmail,
  type SubscribeResult,
} from "@/lib/newsletter";

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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, emailSent: false, error: "Invalid JSON body" } satisfies SubscribeResult,
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const obj = (body ?? {}) as Record<string, unknown>;
  const email = obj.email;

  if (!isValidEmail(email)) {
    return Response.json(
      { ok: false, emailSent: false, error: "Invalid email" } satisfies SubscribeResult,
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const subscription = buildSubscription({
    email,
    utm: sanitizeUtm(obj.utm),
  });

  const send = await sendWelcomeEmail(subscription);

  return Response.json(
    {
      ok: true,
      data: subscription,
      emailSent: send.sent,
      error: send.sent ? undefined : send.reason,
    } satisfies SubscribeResult,
    { status: 200, headers: CORS_HEADERS },
  );
}
