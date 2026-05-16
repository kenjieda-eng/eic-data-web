"use client";

import { useState, type FormEvent } from "react";

export interface NewsletterFormProps {
  /** UTM source 既定値 (例: "top-hero" / "insight-footer") */
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  /** 投稿先 API パス (デフォルト /api/newsletter) */
  endpoint?: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; emailSent: boolean }
  | { kind: "error"; message: string };

export default function NewsletterForm({
  utmSource = "top-hero",
  utmMedium = "web",
  utmCampaign = "weekly-newsletter",
  endpoint = "/api/newsletter",
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          utm: { source: utmSource, medium: utmMedium, campaign: utmCampaign },
        }),
      });
      const data = (await res.json()) as { ok: boolean; emailSent?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus({ kind: "error", message: data.error ?? "登録に失敗しました" });
        return;
      }
      setStatus({ kind: "success", emailSent: data.emailSent ?? false });
      setEmail("");
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
      className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4"
      aria-label="EIC Data Newsletter 購読フォーム"
    >
      <p className="mb-2 text-sm font-medium text-ink">
        EIC Data 週次ニュースレター
      </p>
      <p className="mb-3 text-xs text-subink">
        毎週土曜朝、Insight ハイライト + JEPX 特異日 + 用語集新項目をお届けします。
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus:border-emerald-500 focus:outline-none"
          disabled={status.kind === "submitting"}
        />
        <button
          type="submit"
          disabled={status.kind === "submitting"}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {status.kind === "submitting" ? "登録中…" : "購読する"}
        </button>
      </div>
      {status.kind === "success" && (
        <p className="mt-2 text-sm text-emerald-700" role="status">
          ✓ 登録完了
          {status.emailSent ? "（確認メール送信済）" : "（確認メールは後日配信）"}
        </p>
      )}
      {status.kind === "error" && (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          ⚠️ {status.message}
        </p>
      )}
    </form>
  );
}
