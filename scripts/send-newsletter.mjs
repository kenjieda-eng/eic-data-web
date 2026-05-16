#!/usr/bin/env node
/**
 * Day 5 午後第 5 弾 (2026-05-16) で scaffold 作成。
 *
 * Resend Broadcasts API を用いた Audience 一斉配信。
 * 現状 stub: env 確認 + ペイロード組み立てまで、実 POST は Phase D で完成。
 *
 * 必要 env:
 *   RESEND_API_KEY        (GitHub Actions secrets)
 *   RESEND_AUDIENCE_ID    (省略時 list/create で自動解決、scaffold は明示推奨)
 */

import { readFile } from "node:fs/promises";

const { RESEND_API_KEY, RESEND_AUDIENCE_ID } = process.env;
if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY missing — abort");
  process.exit(1);
}

const html = await readFile("dist/newsletter-preview.html", "utf8").catch(() => null);
if (!html) {
  console.error("dist/newsletter-preview.html missing — run generate-newsletter.mjs first");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const payload = {
  audience_id: RESEND_AUDIENCE_ID ?? "(auto-resolve)",
  from: "EIC Data <onboarding@resend.dev>",
  subject: `EIC Data Weekly — ${today}`,
  html,
};

// TODO Phase D: 実際に POST https://api.resend.com/broadcasts を実行
//   const res = await fetch("https://api.resend.com/broadcasts", {
//     method: "POST",
//     headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });
//   const data = await res.json();
//   console.log("Broadcast scheduled:", data);

console.log("[scaffold] Would POST broadcast to Resend:", {
  ...payload,
  html: `<${html.length} bytes>`,
});
console.log("[scaffold] Real POST is gated until Phase D — uncomment fetch call to enable.");
