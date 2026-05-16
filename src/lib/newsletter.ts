/**
 * Tier 2 Newsletter — 購読データスキーマ + Resend Free 連携 helper
 *
 * Phase C Day 5 午後タスク 3 (2026-05-16) で実装。週次ニュースレター
 * (Insight ハイライト + JEPX 特異日 + 用語集新項目) の購読基盤。
 *
 * Resend API キー (RESEND_API_KEY) は EDA さん環境変数として後追加。
 * 未設定でも購読 API は購読データを返す (email confirmation skipped)。
 */

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_FROM_DEFAULT = "EIC Data <newsletter@data.eic-jp.org>";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const res = await fetch(RESEND_API_URL, {
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
