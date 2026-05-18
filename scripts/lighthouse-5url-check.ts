/**
 * Lighthouse 5 URL pass チェッカ - 本番 URL に対する Performance / A11y / CLS 閾値確認
 *
 * 起草: 2026-05-18 (機能完全形達成 60/60 + OGP 全配置後の品質保証準備)
 * 実機実行予定: 2026-05-19 (火) 統合テスト Day 1
 *
 * 仕様:
 *   - .lighthouserc.json から閾値を動的読み込み (hard-code 禁止)
 *   - 既定閾値 (現状値、勝手に厳格化しない):
 *       Performance:    0.90
 *       Accessibility:  0.90
 *       Best Practices: 0.90
 *       SEO:            0.90
 *       CLS:           ≤ 0.10
 *   - 5 URL (本番) を Lighthouse で計測 → 各 URL 各カテゴリで閾値判定
 *   - lhci CLI を npx 経由で実行 (devDependencies に追加せず、5/19 で `npx` 一発)
 *
 * 使用:
 *   pnpm dlx tsx scripts/lighthouse-5url-check.ts
 *   pnpm dlx tsx scripts/lighthouse-5url-check.ts --base http://localhost:3000
 *
 * 5/19 実機実行時の事前準備:
 *   pnpm add -D tsx     # 本スクリプト実行に必要
 *   # lhci は npx 経由なので install 不要 (初回 npx で自動取得)
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DEFAULT_BASE = "https://data.eic-jp.org";
// 本番 URL 5 サンプル: TOP / Insight ハブ / Insight #60 / catalog ハブ / data-quality
const URL_PATHS = [
  "/",
  "/insight/",
  "/insight/fed-funds-vs-fx/",
  "/catalog/",
  "/data-quality/",
];

interface LhciAssertion {
  minScore?: number;
  maxNumericValue?: number;
}
type LhciAssertionTuple = [string, LhciAssertion];
interface LhciConfig {
  ci?: {
    assert?: {
      assertions?: Record<string, [string, LhciAssertion] | string>;
    };
  };
}

function parseArgs(): { base: string } {
  const args = process.argv.slice(2);
  let base = DEFAULT_BASE;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--base" && args[i + 1]) {
      base = args[i + 1].replace(/\/$/, "");
      i++;
    }
  }
  return { base };
}

function loadThresholds(): {
  categories: Record<string, number>;
  cls: number;
} {
  // .lighthouserc.json の閾値を動的に読み込む (現状値を尊重、勝手に厳格化しない)
  const cfgPath = join(process.cwd(), ".lighthouserc.json");
  const cfg: LhciConfig = JSON.parse(readFileSync(cfgPath, "utf-8"));
  const assertions = cfg.ci?.assert?.assertions ?? {};
  const categories: Record<string, number> = {};
  let cls = 0.1;
  for (const [key, v] of Object.entries(assertions)) {
    if (!Array.isArray(v)) continue;
    const [, opts] = v as LhciAssertionTuple;
    if (key.startsWith("categories:") && opts.minScore !== undefined) {
      categories[key.replace("categories:", "")] = opts.minScore;
    }
    if (key === "cumulative-layout-shift" && opts.maxNumericValue !== undefined) {
      cls = opts.maxNumericValue;
    }
  }
  return { categories, cls };
}

interface LhrAudit {
  numericValue?: number;
  score?: number | null;
}
interface LhrCategory {
  score: number | null;
}
interface Lhr {
  finalUrl: string;
  categories: Record<string, LhrCategory>;
  audits: Record<string, LhrAudit>;
}

function runLighthouseOnUrl(url: string, outDir: string): Lhr {
  // Lighthouse を 1 URL に対して 1 回実行、JSON 結果を取得
  // chrome-launcher は lighthouse パッケージ依存に含まれる
  // --quiet で stdout を抑制、--output=json で structured 結果
  const reportPath = join(outDir, `lhr-${Date.now()}.json`);
  execFileSync(
    "npx",
    [
      "-y",
      "lighthouse",
      url,
      "--quiet",
      "--chrome-flags=--headless=new --no-sandbox",
      "--output=json",
      `--output-path=${reportPath}`,
      "--preset=desktop",
      "--only-categories=performance,accessibility,best-practices,seo",
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  const lhr = JSON.parse(readFileSync(reportPath, "utf-8")) as Lhr;
  return lhr;
}

interface CheckResult {
  url: string;
  failures: string[];
  scores: Record<string, number>;
  cls: number;
}

function evaluateLhr(
  lhr: Lhr,
  thresholds: { categories: Record<string, number>; cls: number },
): CheckResult {
  const failures: string[] = [];
  const scores: Record<string, number> = {};
  for (const [cat, threshold] of Object.entries(thresholds.categories)) {
    const lhrCat = lhr.categories[cat];
    const score = lhrCat?.score ?? 0;
    scores[cat] = score;
    if (score < threshold) {
      failures.push(`${cat} score ${score.toFixed(2)} < ${threshold}`);
    }
  }
  const clsAudit = lhr.audits["cumulative-layout-shift"];
  const cls = clsAudit?.numericValue ?? 0;
  if (cls > thresholds.cls) {
    failures.push(`CLS ${cls.toFixed(3)} > ${thresholds.cls}`);
  }
  return { url: lhr.finalUrl, failures, scores, cls };
}

async function main(): Promise<void> {
  const { base } = parseArgs();
  const thresholds = loadThresholds();
  console.log(`[lighthouse-5url-check] base = ${base}`);
  console.log(`[lighthouse-5url-check] thresholds = ${JSON.stringify(thresholds)}`);

  const tmp = mkdtempSync(join(tmpdir(), "lhci-5url-"));
  const results: CheckResult[] = [];
  try {
    for (const path of URL_PATHS) {
      const url = `${base}${path}`;
      console.log(`\n[lighthouse-5url-check] running Lighthouse on ${url}`);
      try {
        const lhr = runLighthouseOnUrl(url, tmp);
        const r = evaluateLhr(lhr, thresholds);
        results.push(r);
        const status = r.failures.length === 0 ? "✅" : "❌";
        console.log(`  ${status} ${url}`);
        for (const [cat, score] of Object.entries(r.scores)) {
          console.log(`     ${cat}: ${score.toFixed(2)}`);
        }
        console.log(`     CLS: ${r.cls.toFixed(3)}`);
        if (r.failures.length > 0) {
          for (const f of r.failures) console.log(`     FAIL: ${f}`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`  ❌ ${url} — Lighthouse run error: ${msg}`);
        results.push({ url, failures: [`run error: ${msg}`], scores: {}, cls: 0 });
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  const failedUrls = results.filter((r) => r.failures.length > 0);
  console.log(`\n[lighthouse-5url-check] total=${results.length} pass=${results.length - failedUrls.length} fail=${failedUrls.length}`);
  if (failedUrls.length > 0) {
    process.exit(1);
  }
  console.log("🎉 All 5 URLs passed Lighthouse thresholds");
}

main().catch((e) => {
  console.error("[lighthouse-5url-check] fatal:", e);
  process.exit(1);
});

// readFileSync は CommonJS インポートのため上で named import 済 (TS strip-types 互換)
// Bun/Node 22+ で `node --experimental-strip-types scripts/lighthouse-5url-check.ts` も動作
void writeFileSync; // silence "unused" for future extension
