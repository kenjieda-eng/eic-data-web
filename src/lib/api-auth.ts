/**
 * N6 API 認証 — Token 発行 + validation の最小実装
 *
 * Phase C Day 5 午後第 4 弾 (2026-05-16) で実装。
 * - HMAC-SHA256 (env: API_AUTH_SECRET) で署名された opaque token
 * - Token = base64url(payload).base64url(signature)
 *   payload = { email, scope, iat, exp }
 * - GET /api/auth?token=... で validation
 * - POST /api/auth { email, agreedToTerms: true } で発行
 * - env (API_AUTH_SECRET) 未設定時は graceful degradation: 簡易デモトークン発行
 *   (本番運用時は env 必須、Vercel Project Settings で設定)
 *
 * 既存 /api/catalog + /api/indicator/[id] は public のまま、
 * 将来的に重い endpoint (/api/series/[id]/data 等) で本 token を任意ヘッダ照合する設計。
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 日
const DEMO_SECRET = "eic-data-demo-secret-do-not-use-in-prod";

export interface TokenPayload {
  email: string;
  scope: string;
  iat: number;
  exp: number;
}

export interface IssueResult {
  ok: boolean;
  token?: string;
  expiresAt?: string;
  demo?: boolean;
  error?: string;
}

export interface ValidateResult {
  ok: boolean;
  payload?: TokenPayload;
  reason?: string;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function getSecret(env: Record<string, string | undefined>): { secret: string; demo: boolean } {
  const s = env.API_AUTH_SECRET;
  if (s && s.length >= 16) return { secret: s, demo: false };
  return { secret: DEMO_SECRET, demo: true };
}

export function issueToken(
  input: { email: string; agreedToTerms: boolean; scope?: string; ttlSeconds?: number },
  env: Record<string, string | undefined> = process.env,
): IssueResult {
  if (!input.agreedToTerms) {
    return { ok: false, error: "Terms must be accepted" };
  }
  const email = (input.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, error: "Invalid email" };
  }
  const { secret, demo } = getSecret(env);
  const now = Math.floor(Date.now() / 1000);
  const ttl = input.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const payload: TokenPayload = {
    email,
    scope: input.scope ?? "read",
    iat: now,
    exp: now + ttl,
  };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  const sigB64 = b64url(createHmac("sha256", secret).update(payloadB64).digest());
  const token = `${payloadB64}.${sigB64}`;
  return {
    ok: true,
    token,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    demo,
  };
}

export function validateToken(
  token: unknown,
  env: Record<string, string | undefined> = process.env,
): ValidateResult {
  if (typeof token !== "string" || !token.includes(".")) {
    return { ok: false, reason: "Token must be 'payload.signature'" };
  }
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) {
    return { ok: false, reason: "Malformed token" };
  }
  const { secret } = getSecret(env);
  const expected = createHmac("sha256", secret).update(payloadB64).digest();
  let provided: Buffer;
  try {
    provided = b64urlDecode(sigB64);
  } catch {
    return { ok: false, reason: "Bad signature encoding" };
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { ok: false, reason: "Signature mismatch" };
  }
  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8")) as TokenPayload;
  } catch {
    return { ok: false, reason: "Bad payload encoding" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) {
    return { ok: false, reason: "Token expired" };
  }
  return { ok: true, payload };
}

/** 任意エンドポイント用の任意ヘッダ照合 helper (Authorization: Bearer ...) */
export function readBearerToken(headers: Headers): string | null {
  const auth = headers.get("authorization") ?? headers.get("Authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/** 一意な request-id を発行 (rate limit 連携準備、現状はログ用) */
export function generateRequestId(): string {
  return randomBytes(8).toString("hex");
}
