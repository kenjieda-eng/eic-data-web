/**
 * GET /api/newsletter/confirm?token=... — Double opt-in 確定
 *
 * 1. token 検証 (action="confirm" + HMAC + 期限)
 * 2. Resend Audience 自動取得 (RESEND_AUDIENCE_ID あればそれ、なければ list/create)
 * 3. Contact 追加 (POST /audiences/:id/contacts)
 * 4. /newsletter/confirm?status=ok&email=... にリダイレクト
 *
 * RESEND_API_KEY 未設定 → 即座に status=scaffold で confirm ページにリダイレクト
 */

import {
  addContactToAudience,
  getOrCreateDefaultAudience,
  verifyToken,
} from "@/lib/newsletter";

function buildRedirect(
  request: Request,
  status: string,
  extras: Record<string, string> = {},
): Response {
  const url = new URL(request.url);
  const target = new URL("/newsletter/confirm", url.origin);
  target.searchParams.set("status", status);
  for (const [k, v] of Object.entries(extras)) target.searchParams.set(k, v);
  return Response.redirect(target.toString(), 303);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const v = verifyToken(token, "confirm");
  if (!v.ok || !v.payload) {
    return buildRedirect(request, "invalid", { reason: v.reason ?? "unknown" });
  }
  const email = v.payload.email;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return buildRedirect(request, "scaffold", { email });
  }

  try {
    const audienceId = await getOrCreateDefaultAudience(apiKey);
    const added = await addContactToAudience(apiKey, audienceId, email);
    if (!added.ok) {
      return buildRedirect(request, "error", {
        email,
        reason: `Resend contact add HTTP ${added.status}`,
      });
    }
    return buildRedirect(request, "ok", { email });
  } catch (e) {
    return buildRedirect(request, "error", {
      email,
      reason: e instanceof Error ? e.message : String(e),
    });
  }
}
