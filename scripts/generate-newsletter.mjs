#!/usr/bin/env node
/**
 * Day 5 午後第 5 弾 (2026-05-16) で scaffold 作成。
 *
 * 週次ニュースレター本文生成。現状 stub:
 *   - dist/newsletter-preview.html を出力 (ハードコード文言、Phase D で動的化)
 *
 * Phase D で実装予定:
 *   - 過去 7 日に追加された Insight を src/lib/insights.ts から抽出
 *   - JEPX 特異日 (price > 30 円/kWh or < 1 円/kWh) を catalog API から抽出
 *   - 用語集 新項目を src/app/glossary/data.ts から抽出
 *   - これらを HTML テンプレートに流し込んで dist/newsletter-preview.html を生成
 */

import { mkdir, writeFile } from "node:fs/promises";

const today = new Date().toISOString().slice(0, 10);

const html = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><title>EIC Data Weekly ${today}</title></head>
<body style="font-family:-apple-system,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#1e293b">
<h1 style="color:#047857">EIC Data Weekly — ${today}</h1>
<p>※ scaffold 版。Phase D で Insight / JEPX 特異日 / 用語集新項目を動的に挿入予定。</p>

<h2>今週の Insight</h2>
<ul><li>TODO: 過去 7 日に追加された Insight を src/lib/insights.ts から抽出</li></ul>

<h2>JEPX 特異日</h2>
<ul><li>TODO: 30 円/kWh 超 or 1 円/kWh 未満を catalog API から抽出</li></ul>

<h2>用語集 新項目</h2>
<ul><li>TODO: 過去 7 日に追加された用語を src/app/glossary/data.ts から抽出</li></ul>

<hr><p style="font-size:12px;color:#64748b">
EIC Data — エネルギー情報センター<br>
<a href="https://data.eic-jp.org">https://data.eic-jp.org</a>
</p>
</body></html>`;

await mkdir("dist", { recursive: true });
await writeFile("dist/newsletter-preview.html", html, "utf8");
console.log(`Wrote dist/newsletter-preview.html (${html.length} bytes, ${today})`);
