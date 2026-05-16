/**
 * N3 編集者通知 — Insight 公開時に編集チームへ Resend で通知
 *
 * Phase C Day 5 午後第 3 弾 (2026-05-16) で実装。
 * - 既存 src/lib/newsletter.ts の Resend 連携パターンを流用
 * - 編集チーム (リン + アオ + マコト + ハル) の宛先は環境変数で管理
 *   EDITOR_NOTIFY_TO="lin@example.com,ao@example.com,..." (カンマ区切り)
 * - RESEND_API_KEY 未設定時は notified:false で 200 を返す
 */

import { getInsightBySlug, type Insight } from "./insights";

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_FROM_DEFAULT = "EIC Data <editor@data.eic-jp.org>";

export interface EditorNotifyResult {
  ok: boolean;
  notified: boolean;
  recipients: string[];
  insight?: Pick<Insight, "slug" | "title" | "updated">;
  error?: string;
}

export function getInsightForNotification(
  slug: string,
): Pick<Insight, "slug" | "title" | "updated"> | null {
  const insight = getInsightBySlug(slug);
  if (!insight) return null;
  return { slug: insight.slug, title: insight.title, updated: insight.updated };
}

export function parseRecipients(input: unknown): string[] {
  if (typeof input !== "string") return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 254);
}

export function buildEditorEmail(
  insight: Pick<Insight, "slug" | "title" | "updated">,
  insightIndex: number,
): { subject: string; html: string; text: string } {
  const url = `https://data.eic-jp.org/insight/${insight.slug}`;
  const subject = `[EIC Data] Insight #${insightIndex} 公開: ${insight.title}`;
  const text = `EIC Data Insight #${insightIndex} が公開されました。

タイトル: ${insight.title}
公開日: ${insight.updated}
URL: ${url}

編集チーム (リン + アオ + マコト + ハル) は本日中にレビューしてください。

EIC Data — エネルギー情報センター`;
  const html = `<h2>Insight #${insightIndex} 公開: ${insight.title}</h2>
<p><strong>公開日:</strong> ${insight.updated}<br>
<strong>URL:</strong> <a href="${url}">${url}</a></p>
<p>編集チーム (リン + アオ + マコト + ハル) は本日中にレビューしてください。</p>
<p><a href="https://data.eic-jp.org">EIC Data — エネルギー情報センター</a></p>`;
  return { subject, html, text };
}

export async function sendEditorNotification(
  insight: Pick<Insight, "slug" | "title" | "updated">,
  insightIndex: number,
  env: Record<string, string | undefined> = process.env,
): Promise<{ sent: boolean; recipients: string[]; reason?: string }> {
  const apiKey = env.RESEND_API_KEY;
  const recipients = parseRecipients(env.EDITOR_NOTIFY_TO);
  if (!apiKey) {
    return { sent: false, recipients, reason: "RESEND_API_KEY not set" };
  }
  if (recipients.length === 0) {
    return { sent: false, recipients, reason: "EDITOR_NOTIFY_TO not set" };
  }
  const from = env.RESEND_FROM ?? RESEND_FROM_DEFAULT;
  const { subject, html, text } = buildEditorEmail(insight, insightIndex);
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: recipients, subject, html, text }),
    });
    if (!res.ok) {
      return { sent: false, recipients, reason: `Resend HTTP ${res.status}` };
    }
    return { sent: true, recipients };
  } catch (e) {
    return {
      sent: false,
      recipients,
      reason: e instanceof Error ? e.message : String(e),
    };
  }
}
