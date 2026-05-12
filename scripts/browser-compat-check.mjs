#!/usr/bin/env node
// scripts/browser-compat-check.mjs
//
// 統合テスト Day 3 — ブラウザ互換性 静的解析スクリプト
//
// 本番 (data.eic-jp.org) の HTML + CSS chunks を curl で取得し、
// 互換性懸念のある CSS / JS 機能の使用状況を grep + サマライズ。
// Chrome / Edge / Safari / Firefox の最低対応バージョンを Map し、
// 既知の互換性問題を列挙する。
//
// L-019 規律遵守: dev server 起動なし、本番のみ curl。
//
// 出力: scripts/browser-compat-check-result.json + 標準出力サマリー

import { writeFileSync } from "node:fs";

const BASE = process.argv[2] || "https://data.eic-jp.org";

// 計測対象の主要ページ (CSS chunk のスーパーセット狙い)
const PAGES = ["/", "/today", "/insight", "/insight/map", "/catalog", "/data-quality", "/methodology", "/glossary", "/search"];

// 検査対象機能とそれぞれの最低対応版 (caniuse 基準)
const FEATURES = {
  // CSS
  "css:has()": {
    pattern: /:has\(/g,
    type: "CSS",
    minVersions: { Chrome: 105, Edge: 105, Safari: 15.4, Firefox: 121 },
    note: "Firefox は 121 (2023-12) で正式サポート",
  },
  "css:aspect-ratio": {
    pattern: /\baspect-ratio\s*:/g,
    type: "CSS",
    minVersions: { Chrome: 88, Edge: 88, Safari: 15, Firefox: 89 },
    note: "全モダンブラウザ広範サポート (2021)",
  },
  "css:gap (flexbox)": {
    pattern: /\bgap\s*:\s*(?:calc|var|[0-9.])/g,
    type: "CSS",
    minVersions: { Chrome: 84, Edge: 84, Safari: 14.1, Firefox: 63 },
    note: "Safari 14.1+ で flex gap 対応",
  },
  "css:focus-visible": {
    pattern: /:focus-visible/g,
    type: "CSS",
    minVersions: { Chrome: 86, Edge: 86, Safari: 15.4, Firefox: 85 },
    note: "全モダンブラウザ広範サポート",
  },
  "css:backdrop-filter": {
    pattern: /\bbackdrop-filter\b\s*:/g,
    type: "CSS",
    minVersions: { Chrome: 76, Edge: 79, Safari: 9, Firefox: 103 },
    note: "Firefox は 103 (2022-07) からデフォルト有効",
  },
  "css:container-queries": {
    pattern: /@container\s/g,
    type: "CSS",
    minVersions: { Chrome: 105, Edge: 105, Safari: 16, Firefox: 110 },
    note: "Firefox は 110 (2023-02) でデフォルト有効",
  },
  // JS
  "js:Array.prototype.at": {
    pattern: /\.at\(\s*-?\d+\s*\)/g,
    type: "JS",
    minVersions: { Chrome: 92, Edge: 92, Safari: 15.4, Firefox: 90 },
    note: "ES2022、Safari 15.4+ 必須",
  },
  "js:Object.hasOwn": {
    pattern: /\bObject\.hasOwn\s*\(/g,
    type: "JS",
    minVersions: { Chrome: 93, Edge: 93, Safari: 15.4, Firefox: 92 },
    note: "ES2022、Safari 15.4+ 必須",
  },
  "js:structuredClone": {
    pattern: /\bstructuredClone\s*\(/g,
    type: "JS",
    minVersions: { Chrome: 98, Edge: 98, Safari: 15.4, Firefox: 94 },
    note: "Safari 15.4+ 必須",
  },
  "js:Array.prototype.flatMap": {
    pattern: /\.flatMap\(/g,
    type: "JS",
    minVersions: { Chrome: 69, Edge: 79, Safari: 12, Firefox: 62 },
    note: "ES2019、全モダンブラウザ広範サポート",
  },
  "js:String.prototype.replaceAll": {
    pattern: /\.replaceAll\(/g,
    type: "JS",
    minVersions: { Chrome: 85, Edge: 85, Safari: 13.1, Firefox: 77 },
    note: "ES2021、全モダンブラウザ広範サポート",
  },
};

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "browser-compat-check/1.0" } });
  if (!res.ok) return { ok: false, status: res.status, body: "" };
  return { ok: true, status: res.status, body: await res.text() };
}

function uniqueCssUrls(html) {
  const matches = [...html.matchAll(/href="(\/_next\/static\/chunks\/[a-zA-Z0-9~_.-]+\.css)"/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

async function collectAllAssets() {
  const cssUrls = new Set();
  const htmlBodies = [];
  for (const path of PAGES) {
    const { ok, body } = await fetchText(`${BASE}${path}`);
    if (!ok) continue;
    htmlBodies.push({ path, body });
    for (const u of uniqueCssUrls(body)) cssUrls.add(u);
  }
  const cssBodies = [];
  for (const u of cssUrls) {
    const { ok, body } = await fetchText(`${BASE}${u}`);
    if (ok) cssBodies.push({ url: u, body });
  }
  return { htmlBodies, cssBodies };
}

function tally({ htmlBodies, cssBodies }) {
  const results = {};
  for (const [name, spec] of Object.entries(FEATURES)) {
    const inHtml = htmlBodies.reduce(
      (acc, { body }) => acc + (body.match(spec.pattern) || []).length,
      0,
    );
    const inCss = cssBodies.reduce(
      (acc, { body }) => acc + (body.match(spec.pattern) || []).length,
      0,
    );
    results[name] = {
      type: spec.type,
      usedInHtml: inHtml,
      usedInCss: inCss,
      total: inHtml + inCss,
      minVersions: spec.minVersions,
      note: spec.note,
    };
  }
  return results;
}

(async () => {
  const assets = await collectAllAssets();
  const features = tally(assets);

  const summary = {
    base: BASE,
    runAt: new Date().toISOString(),
    pagesScanned: PAGES.length,
    htmlBodies: assets.htmlBodies.length,
    cssBodies: assets.cssBodies.length,
    features,
  };

  writeFileSync(
    new URL("./browser-compat-check-result.json", import.meta.url),
    JSON.stringify(summary, null, 2),
  );

  console.log("=== ブラウザ互換性 静的解析 ===");
  console.log(`base: ${BASE}`);
  console.log(`scanned: ${PAGES.length} pages, ${assets.cssBodies.length} CSS chunks\n`);

  const rows = Object.entries(features).map(([name, f]) => ({
    feature: name,
    type: f.type,
    used: f.total,
    Chrome: `≥${f.minVersions.Chrome}`,
    Edge: `≥${f.minVersions.Edge}`,
    Safari: `≥${f.minVersions.Safari}`,
    Firefox: `≥${f.minVersions.Firefox}`,
  }));
  console.table(rows);

  const concerns = [];
  for (const [name, f] of Object.entries(features)) {
    if (f.total === 0) continue;
    // Safari の閾値が高い (15.4+) ものは要注意
    if (f.minVersions.Safari >= 15.4 && f.total > 0) {
      concerns.push(`${name}: 使用 ${f.total} 回、Safari ${f.minVersions.Safari}+ 必須 (${f.note})`);
    }
  }
  console.log("\n=== 互換性懸念 ===");
  if (concerns.length === 0) {
    console.log("✅ 既知の互換性問題なし");
  } else {
    for (const c of concerns) console.log("⚠️ " + c);
    console.log("\n注: いずれも Safari 15.4+ (2022-03 リリース) で動作。Phase D 開始時点 (2026-06) では業界最低サポート水準を満たす。");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
