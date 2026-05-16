/**
 * GET /api/newsletter/unsubscribe?token=... — 1-click 解除
 *
 * 1. token 検証 (action="unsubscribe" + HMAC + 期限)
 * 2. Resend Audience 解決
 * 3. Contact 削除 (DELETE /audiences/:id/contacts/:email)
 * 4. /newsletter/unsubscribe?status=ok&email=... にリダイレクト
 */

import {
  getOrCreateDefaultAudience,
  removeContactFromAudience,
  verifyToken,
} from "@/lib/newsletter";

function buildRedirect(
  request: Request,
  status: string,
  extras: Record<string, string> = {},
): Response {
  const url = new URL(request.url);
  const target = new URL("/newsletter/unsubscribe", url.origin);
  target.searchParams.set("status", status);
  for (const [k, v] of Object.entries(extras)) target.searchParams.set(k, v);
  return Response.redirect(target.toString(), 303);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const v = verifyToken(token, "unsubscribe");
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
    const removed = await removeContactFromAudience(apiKey, audienceId, email);
    if (!removed.ok) {
      return buildRedirect(request, "error", {
        email,
        reason: `Resend contact delete HTTP ${removed.status}`,
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
