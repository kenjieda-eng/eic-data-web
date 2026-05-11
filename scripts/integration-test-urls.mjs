#!/usr/bin/env node
// scripts/integration-test-urls.mjs
//
// 統合テスト Day 1 — 全 URL HTTP 200 確認スクリプト
//
// Phase C Day 5 完走後の最初の品質保証として、本番 (data.eic-jp.org) の
// 全 URL (sitemap 195 + 補助 12 = 207) を並列で curl 検証する。
// 出力: docs/integration-test-report-2026-05-12.md に貼り付け可能な
//       カテゴリ別サマリー + 異常 URL リスト。
//
// 使い方:
//   node scripts/integration-test-urls.mjs [--base https://data.eic-jp.org]
//
// 出力 JSON: scripts/integration-test-urls-result.json
//
// L-019 規律遵守: 本番のみ叩く、dev server は起動しない。

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const argv = process.argv.slice(2);
let BASE = "https://data.eic-jp.org";
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--base" && argv[i + 1]) BASE = argv[i + 1].replace(/\/$/, "");
}

const CONCURRENCY = 12;
const TIMEOUT_MS = 30_000;

const FIXED_TOPLEVEL = [
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

const EXTRA = [
  "/sitemap.xml",
  "/robots.txt",
  "/opengraph-image",
  "/twitter-image",
  "/download/all",
];

const API = [
  "/api/catalog",
  "/api/indicator/jepx-spot-tokyo",
  "/api/indicator/us-cpi-yoy",
  "/api/indicator/us-fed-funds-rate",
  "/api/indicator/us-industrial-production",
  "/api/indicator/fx-usdjpy-monthly-avg",
  "/api/press-ogp",
];

async function fetchSitemapURLs() {
  const res = await fetch(`${BASE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml HTTP ${res.status}`);
  const xml = await res.text();
  const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) =>
    m[1].replace(BASE, ""),
  );
  return urls;
}

function categorize(path) {
  if (path === "/" || FIXED_TOPLEVEL.includes(path)) return "fixed";
  if (path.startsWith("/insight/map")) return "fixed";
  if (path.startsWith("/insight/")) return "insight";
  if (path.startsWith("/catalog/")) return "catalog";
  if (path.startsWith("/domain/")) return "domain";
  if (path.startsWith("/glossary/")) return "glossary";
  if (path.startsWith("/today/")) return "today";
  if (path.startsWith("/api/")) return "api";
  if (
    path === "/sitemap.xml" ||
    path === "/robots.txt" ||
    path === "/opengraph-image" ||
    path === "/twitter-image" ||
    path === "/download/all"
  )
    return "meta";
  return "other";
}

async function checkOne(path) {
  const url = `${BASE}${path}`;
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
    });
    let status = res.status;
    let contentType = res.headers.get("content-type") || "";
    let contentLength = res.headers.get("content-length") || "";
    // HEAD may not be supported on edge routes (e.g. /api/press-ogp) — fall back to GET
    if (status === 405 || status === 0 || (status >= 500 && status < 600)) {
      const get = await fetch(url, { redirect: "manual", signal: controller.signal });
      status = get.status;
      contentType = get.headers.get("content-type") || contentType;
      contentLength = get.headers.get("content-length") || contentLength;
      // drain body
      try {
        await get.arrayBuffer();
      } catch {}
    }
    return {
      path,
      url,
      status,
      ok: status >= 200 && status < 400,
      contentType,
      contentLength,
      elapsedMs: Date.now() - start,
      category: categorize(path),
    };
  } catch (err) {
    return {
      path,
      url,
      status: 0,
      ok: false,
      error: String(err?.message ?? err),
      elapsedMs: Date.now() - start,
      category: categorize(path),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runAll(paths) {
  const results = new Array(paths.length);
  let cursor = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= paths.length) break;
      results[i] = await checkOne(paths[i]);
      const r = results[i];
      const flag = r.ok ? "✓" : "✗";
      process.stdout.write(
        `${flag} ${String(r.status).padStart(3)} ${r.elapsedMs.toString().padStart(5)}ms  ${r.path}\n`,
      );
    }
  });
  await Promise.all(workers);
  return results;
}

function summarize(results) {
  const byCat = {};
  for (const r of results) {
    const c = r.category;
    if (!byCat[c]) byCat[c] = { total: 0, ok: 0, bad: 0, items: [] };
    byCat[c].total++;
    if (r.ok) byCat[c].ok++;
    else byCat[c].bad++;
    byCat[c].items.push(r);
  }
  return byCat;
}

(async () => {
  console.log(`[integration-test-urls] base = ${BASE}`);
  const sitemap = await fetchSitemapURLs();
  const allPaths = Array.from(new Set([...sitemap, ...EXTRA, ...API]));
  console.log(`[integration-test-urls] target = ${allPaths.length} URLs`);
  const results = await runAll(allPaths);
  const byCat = summarize(results);

  const totalOk = results.filter((r) => r.ok).length;
  const totalBad = results.filter((r) => !r.ok).length;

  console.log("");
  console.log("=== SUMMARY ===");
  for (const c of Object.keys(byCat)) {
    const s = byCat[c];
    console.log(
      `${c.padEnd(10)} total=${s.total.toString().padStart(4)} ok=${s.ok.toString().padStart(4)} bad=${s.bad.toString().padStart(4)}`,
    );
  }
  console.log(`TOTAL      total=${String(results.length).padStart(4)} ok=${String(totalOk).padStart(4)} bad=${String(totalBad).padStart(4)}`);

  if (totalBad > 0) {
    console.log("");
    console.log("=== FAILURES ===");
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`${r.status} ${r.path} ${r.error ?? ""}`);
    }
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(__dirname, "integration-test-urls-result.json");
  writeFileSync(
    outPath,
    JSON.stringify(
      { base: BASE, runAt: new Date().toISOString(), totals: { total: results.length, ok: totalOk, bad: totalBad }, byCategory: byCat, results },
      null,
      2,
    ),
  );
  console.log(`\nwrote ${outPath}`);
  process.exit(totalBad > 0 ? 1 : 0);
})();
