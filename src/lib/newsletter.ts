/**
 * Tier 2 Newsletter — Resend 公式運用版 (Day 5 午後第 5 弾、2026-05-16)
 *
 * 機能:
 * - email validation + UTM 抽出 (午後 1 から継承)
 * - HMAC-SHA256 confirm/unsubscribe token 発行 + 検証
 * - Resend Audience 自動取得 (1 個もなければ自動作成) + Contact 追加/削除
 * - Double opt-in 確認メール送信
 * - graceful degradation: RESEND_API_KEY 未設定時は scaffold モード (購読データ返却のみ)
 *
 * env:
 *   RESEND_API_KEY        Resend API キー (必須、未設定時 scaffold)
 *   RESEND_FROM           送信元 (省略時 "EIC Data <onboarding@resend.dev>")
 *   RESEND_AUDIENCE_ID    既存 Audience ID (省略時 list/create で自動解決)
 *   NEWSLETTER_SECRET     confirm/unsubscribe HMAC 秘密鍵 (16+ chars、未設定時 demo 鍵)
 *   NEWSLETTER_BASE_URL   confirm/unsubscribe link 用 (省略時 "https://data.eic-jp.org")
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const RESEND_API_URL = "https://api.resend.com";
const RESEND_FROM_DEFAULT = "EIC Data <onboarding@resend.dev>";
const DEFAULT_AUDIENCE_NAME = "EIC Data Weekly Newsletter";
const DEFAULT_BASE_URL = "https://data.eic-jp.org";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_DEMO_SECRET = "eic-newsletter-demo-secret-do-not-use";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 日

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface SubscribeInput {
  email: string;
  utm?: UtmParams;
}

export interface SubscriptionData {
  email: string;
  utm: UtmParams;
  subscribedAt: string;
}

export interface SubscribeResult {
  ok: boolean;
  data?: SubscriptionData;
  emailSent: boolean;
  confirmRequired?: boolean;
  scaffold?: boolean;
  error?: string;
}

export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

export function sanitizeUtm(input: unknown): UtmParams {
  if (!input || typeof input !== "object") return {};
  const obj = input as Record<string, unknown>;
  const utm: UtmParams = {};
  for (const key of ["source", "medium", "campaign"] as const) {
    const v = obj[key];
    if (typeof v === "string" && v.length > 0 && v.length <= 100) {
      utm[key] = v.trim();
    }
  }
  return utm;
}

export function buildSubscription(input: SubscribeInput): SubscriptionData {
  return {
    email: input.email.trim().toLowerCase(),
    utm: input.utm ?? {},
    subscribedAt: new Date().toISOString(),
  };
}

// ============================================================
// Confirm / Unsubscribe Token (HMAC-SHA256)
// ============================================================

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function tokenSecret(env: Record<string, string | undefined>): string {
  const s = env.NEWSLETTER_SECRET;
  return s && s.length >= 16 ? s : TOKEN_DEMO_SECRET;
}

export type TokenAction = "confirm" | "unsubscribe";

export interface TokenPayload {
  email: string;
  action: TokenAction;
  iat: number;
  exp: number;
}

export function generateToken(
  email: string,
  action: TokenAction,
  env: Record<string, string | undefined> = process.env,
  ttlSeconds: number = TOKEN_TTL_SECONDS,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    email: email.trim().toLowerCase(),
    action,
    iat: now,
    exp: now + ttlSeconds,
  };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  const sigB64 = b64url(
    createHmac("sha256", tokenSecret(env)).update(payloadB64).digest(),
  );
  return `${payloadB64}.${sigB64}`;
}

export interface VerifyResult {
  ok: boolean;
  payload?: TokenPayload;
  reason?: string;
}

export function verifyToken(
  token: unknown,
  expectedAction: TokenAction,
  env: Record<string, string | undefined> = process.env,
): VerifyResult {
  if (typeof token !== "string" || !token.includes(".")) {
    return { ok: false, reason: "Malformed token" };
  }
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return { ok: false, reason: "Malformed token" };
  const expected = createHmac("sha256", tokenSecret(env))
    .update(payloadB64)
    .digest();
  let provided: Buffer;
  try {
    provided = b64urlDecode(sigB64);
  } catch {
    return { ok: false, reason: "Bad signature encoding" };
  }
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return { ok: false, reason: "Signature mismatch" };
  }
  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8")) as TokenPayload;
  } catch {
    return { ok: false, reason: "Bad payload encoding" };
  }
  if (payload.action !== expectedAction) {
    return { ok: false, reason: `Wrong action (expected ${expectedAction})` };
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) {
    return { ok: false, reason: "Token expired" };
  }
  return { ok: true, payload };
}

// ============================================================
// Confirm / Unsubscribe Email Body
// ============================================================

export interface ConfirmEmailLinks {
  confirmUrl: string;
  unsubscribeUrl: string;
}

export function buildConfirmEmailLinks(
  email: string,
  env: Record<string, string | undefined> = process.env,
): ConfirmEmailLinks {
  const base = (env.NEWSLETTER_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const confirmToken = generateToken(email, "confirm", env);
  const unsubscribeToken = generateToken(email, "unsubscribe", env);
  return {
    confirmUrl: `${base}/api/newsletter/confirm?token=${encodeURIComponent(confirmToken)}`,
    unsubscribeUrl: `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
  };
}

export function buildConfirmEmail(
  email: string,
  links: ConfirmEmailLinks,
): { subject: string; html: string; text: string } {
  const subject = "[EIC Data] ニュースレター購読確認";
  const text = `${email} 様

EIC Data 週次ニュースレターへの購読リクエストを受け付けました。
以下のリンクをクリックして購読を確定してください (7 日間有効):

${links.confirmUrl}

毎週土曜朝 8:00 JST に Insight ハイライト + JEPX 特異日 + 用語集新項目をお届けします。

※ このリクエストに心当たりがない場合は、このメールを破棄してください。購読は確定されません。
※ いつでも以下のリンクで解除できます:
${links.unsubscribeUrl}

EIC Data — エネルギー情報センター
https://data.eic-jp.org`;
  const html = `<p>${email} 様</p>
<p>EIC Data 週次ニュースレターへの購読リクエストを受け付けました。<br>
以下のボタン (リンク) をクリックして購読を確定してください (7 日間有効):</p>
<p><a href="${links.confirmUrl}" style="display:inline-block;padding:10px 20px;background:#047857;color:#fff;text-decoration:none;border-radius:6px;">購読を確定する</a></p>
<p>毎週土曜朝 8:00 JST に Insight ハイライト + JEPX 特異日 + 用語集新項目をお届けします。</p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
<p style="font-size:12px;color:#64748b">※ このリクエストに心当たりがない場合は、このメールを破棄してください。購読は確定されません。<br>
※ いつでも <a href="${links.unsubscribeUrl}">こちらから解除</a> できます。</p>
<p><a href="https://data.eic-jp.org">EIC Data — エネルギー情報センター</a></p>`;
  return { subject, html, text };
}

// ============================================================
// Resend Audience / Contact API
// ============================================================

interface ResendAudienceListItem {
  id: string;
  name: string;
}

interface ResendAudienceListResponse {
  data?: ResendAudienceListItem[];
}

interface ResendAudienceCreateResponse {
  id?: string;
  name?: string;
}

async function resendFetch(
  apiKey: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${RESEND_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export async function getOrCreateDefaultAudience(
  apiKey: string,
  env: Record<string, string | undefined> = process.env,
): Promise<string> {
  const explicit = env.RESEND_AUDIENCE_ID;
  if (explicit && explicit.length > 0) return explicit;
  const listRes = await resendFetch(apiKey, "/audiences");
  if (!listRes.ok) {
    throw new Error(`Audience list failed: HTTP ${listRes.status}`);
  }
  const list = (await listRes.json()) as ResendAudienceListResponse;
  if (list.data && list.data.length > 0) {
    return list.data[0].id;
  }
  const createRes = await resendFetch(apiKey, "/audiences", {
    method: "POST",
    body: JSON.stringify({ name: DEFAULT_AUDIENCE_NAME }),
  });
  if (!createRes.ok) {
    throw new Error(`Audience create failed: HTTP ${createRes.status}`);
  }
  const created = (await createRes.json()) as ResendAudienceCreateResponse;
  if (!created.id) throw new Error("Audience create returned no id");
  return created.id;
}

export async function addContactToAudience(
  apiKey: string,
  audienceId: string,
  email: string,
): Promise<{ ok: boolean; status: number }> {
  const res = await resendFetch(
    apiKey,
    `/audiences/${encodeURIComponent(audienceId)}/contacts`,
    {
      method: "POST",
      body: JSON.stringify({ email, unsubscribed: false }),
    },
  );
  return { ok: res.ok, status: res.status };
}

export async function removeContactFromAudience(
  apiKey: string,
  audienceId: string,
  email: string,
): Promise<{ ok: boolean; status: number }> {
  const res = await resendFetch(
    apiKey,
    `/audiences/${encodeURIComponent(audienceId)}/contacts/${encodeURIComponent(email)}`,
    { method: "DELETE" },
  );
  return { ok: res.ok || res.status === 404, status: res.status };
}

// ============================================================
// Confirm Email Send (Double opt-in 開始)
// ============================================================

export async function sendConfirmEmail(
  data: SubscriptionData,
  env: Record<string, string | undefined> = process.env,
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not set" };
  const from = env.RESEND_FROM ?? RESEND_FROM_DEFAULT;
  const links = buildConfirmEmailLinks(data.email, env);
  const { subject, html, text } = buildConfirmEmail(data.email, links);
  try {
    const res = await fetch(`${RESEND_API_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: [data.email], subject, html, text }),
    });
    if (!res.ok) return { sent: false, reason: `Resend HTTP ${res.status}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

// ============================================================
// Legacy welcome email (午後 1 互換、テスト用に維持)
// ============================================================

export function buildWelcomeEmail(data: SubscriptionData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "EIC Data Newsletter 購読登録ありがとうございます";
  const text = `${data.email} 様

EIC Data 週次ニュースレターへの購読登録が完了しました。
毎週土曜朝に Insight ハイライト + JEPX 特異日 + 用語集新項目をお届けします。

EIC Data — エネルギー情報センター
https://data.eic-jp.org`;
  const html = `<p>${data.email} 様</p>
<p>EIC Data 週次ニュースレターへの購読登録が完了しました。<br>
毎週土曜朝に Insight ハイライト + JEPX 特異日 + 用語集新項目をお届けします。</p>
<p><a href="https://data.eic-jp.org">EIC Data — エネルギー情報センター</a></p>`;
  return { subject, html, text };
}

export async function sendWelcomeEmail(
  data: SubscriptionData,
  env: Record<string, string | undefined> = process.env,
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not set" };
  const from = env.RESEND_FROM ?? RESEND_FROM_DEFAULT;
  const { subject, html, text } = buildWelcomeEmail(data);
  try {
    const res = await fetch(`${RESEND_API_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: [data.email], subject, html, text }),
    });
    if (!res.ok) return { sent: false, reason: `Resend HTTP ${res.status}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
