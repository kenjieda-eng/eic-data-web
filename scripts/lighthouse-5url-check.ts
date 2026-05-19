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
import { setTimeout as sleep } from "node:timers/promises";

// Day 2 (2026-05-19) で追加: Windows で Chrome cleanup race による EPERM 回避
// - 各 URL 間に COOLDOWN_MS の待機 (Chrome プロセス終了待ち)
// - URL ごとに最大 MAX_ATTEMPTS 回まで自動リトライ (一過性エラー吸収)
// - chrome-launcher が掴む user-data-dir lock を解放するため毎回 tmp dir を切り直す
const MAX_ATTEMPTS = 3;
const COOLDOWN_MS = 5_000;

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
  // 試行ごとに独立した user-data-dir を割り当てることで、前回実行が掴んだ
  // SingletonLock を踏まないようにする (Windows で EPERM 多発の主因)
  const chromeUserDataDir = mkdtempSync(join(tmpdir(), "lh-chrome-profile-"));
  try {
    execFileSync(
      "npx",
      [
        "-y",
        "lighthouse",
        url,
        "--quiet",
        `--chrome-flags=--headless=new --no-sandbox --user-data-dir="${chromeUserDataDir}"`,
        "--output=json",
        `--output-path=${reportPath}`,
        "--preset=desktop",
        "--only-categories=performance,accessibility,best-practices,seo",
      ],
      { stdio: ["ignore", "ignore", "inherit"], shell: true },
    );
    const lhr = JSON.parse(readFileSync(reportPath, "utf-8")) as Lhr;
    return lhr;
  } finally {
    // Chrome がまだファイルを掴んでいると EPERM になるので best-effort 削除
    try {
      rmSync(chromeUserDataDir, { recursive: true, force: true });
    } catch {
      /* ignore — 次回起動でも別の tmp dir を切るので残骸が残っても無害 */
    }
  }
}

async function runWithRetry(url: string, outDir: string): Promise<Lhr> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`     ↻ retry ${attempt}/${MAX_ATTEMPTS} after ${COOLDOWN_MS}ms cooldown`);
        await sleep(COOLDOWN_MS);
      }
      return runLighthouseOnUrl(url, outDir);
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`     ⚠ attempt ${attempt} failed: ${msg.split("\n")[0]}`);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
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
    for (let i = 0; i < URL_PATHS.length; i++) {
      const path = URL_PATHS[i];
      const url = `${base}${path}`;
      // 直前の Chrome プロセス終了を待ってから次の URL へ (Windows EPERM 対策)
      if (i > 0) {
        console.log(`\n[lighthouse-5url-check] cooldown ${COOLDOWN_MS}ms before next URL`);
        await sleep(COOLDOWN_MS);
      }
      console.log(`\n[lighthouse-5url-check] running Lighthouse on ${url}`);
      try {
        const lhr = await runWithRetry(url, tmp);
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
        console.log(`  ❌ ${url} — Lighthouse run error after ${MAX_ATTEMPTS} attempts: ${msg}`);
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
