/**
 * 統合テスト Day 1 - 全 URL HTTP 200 自動チェッカ
 *
 * 起草: 2026-05-18 (機能完全形達成 60/60 + OGP 全配置後の品質保証準備)
 * 実機実行予定: 2026-05-19 (火) 統合テスト Day 1
 *
 * 仕様:
 *   - https://data.eic-jp.org/sitemap.xml を取得して全 URL 抽出 (動的、~292+ 件)
 *   - 各 URL に HEAD リクエスト (10 件並列、10 秒タイムアウト)
 *   - 308 redirect は ok 扱い (Next.js trailing-slash 既定挙動)
 *   - 結果サマリ + 失敗 URL リスト出力、失敗時 exit 1
 *
 * 使用:
 *   pnpm dlx tsx scripts/integration-test-day1.ts
 *   pnpm dlx tsx scripts/integration-test-day1.ts --base http://localhost:3000  # ローカル
 *
 * 期待値:
 *   - sitemap.xml に列挙される全 URL が HTTP 200 (or 308 redirect)
 *   - hard-code した URL 件数は無し (sitemap が真実のソース)
 */

const DEFAULT_BASE = "https://data.eic-jp.org";
const TIMEOUT_MS = 10_000;
const CONCURRENT_LIMIT = 10;

interface UrlResult {
  url: string;
  status: number;
  ok: boolean;
  durationMs: number;
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

/**
 * sitemap.xml から <loc> URL を抽出。xml2js 等の追加依存に頼らず regex で対応。
 * sitemap は単純な XML なので regex で十分、依存最小化 (Node 標準のみで動く)。
 */
async function fetchSitemap(base: string): Promise<string[]> {
  const url = `${base}/sitemap.xml`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    throw new Error(`sitemap.xml fetch failed: HTTP ${res.status}`);
  }
  const xml = await res.text();
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  const urls: string[] = [];
  for (const m of matches) {
    urls.push(m[1].trim());
  }
  return urls;
}

async function checkUrl(url: string): Promise<UrlResult> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "manual",
    });
    // 308 / 307 は Next.js trailing-slash の正常リダイレクト = ok 扱い
    const ok = res.ok || res.status === 308 || res.status === 307;
    return { url, status: res.status, ok, durationMs: Date.now() - start };
  } catch (e) {
    return { url, status: 0, ok: false, durationMs: Date.now() - start };
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  let done = 0;
  const total = items.length;
  async function worker(): Promise<void> {
    while (true) {
      const idx = next++;
      if (idx >= total) return;
      results[idx] = await fn(items[idx]);
      done++;
      if (onProgress && (done % 25 === 0 || done === total)) {
        onProgress(done, total);
      }
    }
  }
  const workers = Array.from({ length: Math.min(limit, total) }, worker);
  await Promise.all(workers);
  return results;
}

async function main(): Promise<void> {
  const { base } = parseArgs();
  console.log(`[integration-test-day1] base = ${base}`);

  const urls = await fetchSitemap(base);
  console.log(`[integration-test-day1] checking ${urls.length} URLs from sitemap.xml (concurrent=${CONCURRENT_LIMIT})`);

  const t0 = Date.now();
  const results = await runWithConcurrency(urls, CONCURRENT_LIMIT, checkUrl, (done, total) => {
    console.log(`  progress: ${done}/${total}`);
  });
  const elapsed = (Date.now() - t0) / 1000;

  const failed = results.filter((r) => !r.ok);
  const ok = results.length - failed.length;
  console.log(`\n[integration-test-day1] total=${results.length} ok=${ok} failed=${failed.length} elapsed=${elapsed.toFixed(1)}s`);

  if (failed.length > 0) {
    console.log("\n❌ Failed URLs:");
    for (const r of failed) {
      console.log(`  ${r.status || "ERR"} ${r.url} (${r.durationMs}ms)`);
    }
    process.exit(1);
  }
  console.log("\n🎉 All URLs returned HTTP 200 (or 308 redirect)");
}

main().catch((e) => {
  console.error("[integration-test-day1] fatal:", e);
  process.exit(1);
});

export {};
