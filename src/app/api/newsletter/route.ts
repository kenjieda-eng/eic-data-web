/**
 * POST /api/newsletter — Double opt-in 開始 (確認メール送信)
 *
 * Day 5 午後第 5 弾 (2026-05-16) で午後 1 の scaffold から拡張:
 * - email + UTM 受信、バリデーション
 * - RESEND_API_KEY あり → 確認メール送信 (Resend 経由)
 * - RESEND_API_KEY なし → scaffold モード (scaffold:true で graceful)
 * - 実際の Contact 追加は GET /api/newsletter/confirm?token=... で実行 (Double opt-in)
 */

import {
  buildSubscription,
  isValidEmail,
  resolveFromHeader,
  sanitizeUtm,
  sendConfirmEmail,
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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        ok: true,
        data: subscription,
        emailSent: false,
        scaffold: true,
        confirmRequired: false,
        error: "RESEND_API_KEY not set (scaffold mode)",
      } satisfies SubscribeResult,
      { status: 200, headers: CORS_HEADERS },
    );
  }

  const send = await sendConfirmEmail(subscription);

  if (!send.sent) {
    // 本番運用時の問題切り分け用: from header と reason を必ず log に残す。
    // Vercel Functions logs で grep [newsletter] すれば 1 行で原因が分かる。
    console.warn(
      `[newsletter] confirm email send failed: reason="${send.reason}" from="${resolveFromHeader(process.env)}" to="${subscription.email}"`,
    );
  }

  return Response.json(
    {
      ok: true,
      data: subscription,
      emailSent: send.sent,
      confirmRequired: send.sent,
      error: send.sent ? undefined : send.reason,
    } satisfies SubscribeResult,
    { status: 200, headers: CORS_HEADERS },
  );
}
