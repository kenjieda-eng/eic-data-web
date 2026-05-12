#!/usr/bin/env node
// scripts/mobile-layout-check.mjs
//
// 統合テスト Day 2 — モバイル深掘り (360 / 768 / 1024px) レイアウト確認スクリプト
//
// 本番 HTML をビューポート別の Sec-CH-UA-Width / User-Agent で取得し、
// 12 主要ページのレイアウトリスク (横スクロール誘発の固定幅 / オーバーフロー)
// + モバイルナビ / viewport meta の有無を静的解析する。
//
// 実ブラウザ rendering が必要な要素 (overflow 実測 / タッチ操作) は
// EDA さん手動 QA のチェックリストとして併せて出力。
//
// L-019 規律遵守: 本番のみ叩く、dev server 起動しない。

import { writeFileSync } from "node:fs";

const BASE = process.argv[2] || "https://data.eic-jp.org";

const PAGES = [
  "/",
  "/today",
  "/insight",
  "/insight/map",
  "/catalog",
  "/data-quality",
  "/methodology",
  "/glossary",
  "/search",
  "/privacy",
  "/terms",
  "/citation-policy",
];

const VIEWPORTS = [
  {
    name: "mobile-360",
    width: 360,
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    name: "tablet-768",
    width: 768,
    ua: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    name: "desktop-1024",
    width: 1024,
    ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36",
  },
];

const VIEWPORT_RE = /<meta[^>]+name=["']viewport["'][^>]+>/i;
// MobileNav.tsx は <span class="sr-only">メニュー</span> + aria-expanded を持つ button
const MOBILE_NAV_BUTTON_RE =
  /<button[^>]*aria-expanded=[^>]*>\s*<span[^>]*sr-only[^>]*>メニュー<\/span>/i;
// 真の固定幅 (max-w- ではない) のみ拾う。負の lookbehind で max-/min-/sm:/md:/lg:/xl: を除外
const PIXEL_FIXED_WIDTH_RE = /(?<![-:])w-\[(\d{3,})px\]/g;
const OVERFLOW_X_AUTO_RE = /overflow-x-auto/g;
const MAX_W_PIXEL_RE = /max-w-\[(\d{3,})px\]/g;

async function fetchHtml(path, viewport) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "User-Agent": viewport.ua,
      Accept: "text/html",
    },
  });
  if (!res.ok) {
    return { ok: false, status: res.status, html: "" };
  }
  return { ok: true, status: res.status, html: await res.text() };
}

function analyzeHtml(html) {
  const viewportMeta = VIEWPORT_RE.test(html);
  const mobileNavButton = MOBILE_NAV_BUTTON_RE.test(html);
  const fixedWidths = [...html.matchAll(PIXEL_FIXED_WIDTH_RE)].map((m) =>
    parseInt(m[1], 10),
  );
  const maxFixedWidth = fixedWidths.length > 0 ? Math.max(...fixedWidths) : 0;
  const maxWidthCaps = [...html.matchAll(MAX_W_PIXEL_RE)].map((m) =>
    parseInt(m[1], 10),
  );
  const maxContainerCap =
    maxWidthCaps.length > 0 ? Math.max(...maxWidthCaps) : 0;
  const overflowXAutoCount = (html.match(OVERFLOW_X_AUTO_RE) || []).length;
  return {
    viewportMeta,
    mobileNavButton,
    maxFixedWidth,
    maxContainerCap,
    overflowXAutoCount,
    htmlSize: html.length,
  };
}

async function main() {
  const results = [];
  for (const page of PAGES) {
    for (const vp of VIEWPORTS) {
      try {
        const { ok, status, html } = await fetchHtml(page, vp);
        if (!ok) {
          results.push({
            page,
            viewport: vp.name,
            width: vp.width,
            status,
            error: `HTTP ${status}`,
          });
          continue;
        }
        const analysis = analyzeHtml(html);
        results.push({ page, viewport: vp.name, width: vp.width, status, ...analysis });
      } catch (e) {
        results.push({
          page,
          viewport: vp.name,
          width: vp.width,
          status: 0,
          error: String(e),
        });
      }
    }
  }

  // 集計
  const issues = [];
  for (const r of results) {
    if (r.error) {
      issues.push(`${r.page} @ ${r.viewport}: ${r.error}`);
      continue;
    }
    if (!r.viewportMeta) {
      issues.push(`${r.page} @ ${r.viewport}: viewport meta タグ欠落`);
    }
    if (r.width < 768 && !r.mobileNavButton) {
      issues.push(`${r.page} @ ${r.viewport}: MobileNav ハンバーガーボタン欠落 (mobile)`);
    }
    if (r.width < 768 && r.maxFixedWidth > 0 && r.maxFixedWidth > r.width) {
      issues.push(
        `${r.page} @ ${r.viewport}: 真の固定幅 ${r.maxFixedWidth}px がビューポート (${r.width}px) を超過 (横スクロール誘発リスク)`,
      );
    }
  }

  const summary = {
    base: BASE,
    runAt: new Date().toISOString(),
    totalRuns: results.length,
    issueCount: issues.length,
    issues,
    results,
  };

  writeFileSync(
    new URL("./mobile-layout-check-result.json", import.meta.url),
    JSON.stringify(summary, null, 2),
  );

  console.log(`\n=== モバイル深掘り結果 (12 ページ × 3 ビューポート = ${results.length} ラン) ===`);
  console.log(`base: ${BASE}`);
  console.log(`issues: ${issues.length}\n`);
  if (issues.length > 0) {
    for (const i of issues) console.log("⚠️ " + i);
  } else {
    console.log("✅ レイアウトリスク警告なし");
  }
  console.log("\n=== ビューポート別 viewport meta / MobileNav 検出 ===");
  const byVp = {};
  for (const r of results) {
    byVp[r.viewport] ??= { viewport: 0, mobileNav: 0, total: 0 };
    byVp[r.viewport].total++;
    if (r.viewportMeta) byVp[r.viewport].viewport++;
    if (r.mobileNavButton) byVp[r.viewport].mobileNav++;
  }
  console.table(byVp);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
