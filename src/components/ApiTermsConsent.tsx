"use client";

import { useState, type FormEvent } from "react";

/**
 * ApiTermsConsent — N6 利用規約同意 + Token 発行フォーム
 *
 * Phase C Day 5 午後第 4 弾 (2026-05-16) で実装。
 * - email 入力 + 利用規約同意チェック → POST /api/auth で Token 発行
 * - 発行された Token を画面に表示 (clipboard コピー想定)、メール送信は後追加
 * - env (API_AUTH_SECRET) 未設定時は demo:true で警告表示
 */

interface IssueResponse {
  ok: boolean;
  token?: string;
  expiresAt?: string;
  demo?: boolean;
  error?: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; token: string; expiresAt: string; demo: boolean }
  | { kind: "error"; message: string };

export default function ApiTermsConsent() {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, agreedToTerms: agreed }),
      });
      const data = (await res.json()) as IssueResponse;
      if (!data.ok || !data.token || !data.expiresAt) {
        setStatus({ kind: "error", message: data.error ?? "発行に失敗しました" });
        return;
      }
      setStatus({
        kind: "success",
        token: data.token,
        expiresAt: data.expiresAt,
        demo: data.demo === true,
      });
      setEmail("");
      setAgreed(false);
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "ネットワークエラー",
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-md border border-emerald-200 bg-white p-5"
      aria-label="API 利用規約同意 + Token 発行フォーム"
    >
      <h2 className="mb-2 text-base font-semibold text-ink">
        EIC Data API Token 発行
      </h2>
      <p className="mb-3 text-xs text-subink">
        EIC Data の公開 API (catalog / indicator / series) は認証不要で利用可能ですが、
        重い endpoint や rate limit 適用時に本 Token を <code>Authorization: Bearer …</code>
        ヘッダで送信してください。
      </p>

      <label className="mb-3 block">
        <span className="block text-xs font-medium text-ink">メールアドレス</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-emerald-500 focus:outline-none"
          disabled={status.kind === "submitting"}
        />
      </label>

      <label className="mb-3 flex items-start gap-2 text-xs text-subink">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5"
          disabled={status.kind === "submitting"}
          required
        />
        <span>
          <a href="/terms" className="text-emerald-700 underline hover:text-emerald-900">
            利用規約
          </a>{" "}
          および{" "}
          <a href="/privacy" className="text-emerald-700 underline hover:text-emerald-900">
            プライバシーポリシー
          </a>
          に同意します (出典明示 + 商用利用条件等)。
        </span>
      </label>

      <button
        type="submit"
        disabled={status.kind === "submitting" || !agreed}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {status.kind === "submitting" ? "発行中…" : "Token を発行"}
      </button>

      {status.kind === "success" && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50/40 p-3" role="status">
          <p className="mb-1 text-xs font-medium text-emerald-800">
            ✓ Token を発行しました (有効期限: {status.expiresAt})
            {status.demo && (
              <span className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">
                demo mode (API_AUTH_SECRET 未設定)
              </span>
            )}
          </p>
          <code className="mt-1 block break-all rounded bg-slate-100 p-2 font-mono text-[11px] text-ink">
            {status.token}
          </code>
          <p className="mt-2 text-[11px] text-faint">
            この値を <code>Authorization: Bearer {`<token>`}</code> ヘッダで送信してください。
          </p>
        </div>
      )}
      {status.kind === "error" && (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          ⚠️ {status.message}
        </p>
      )}
    </form>
  );
}
