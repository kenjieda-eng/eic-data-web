/**
 * API データ整合性検証 - GET API レスポンスの構造 + 件数を catalog raw URL と突合
 *
 * 起草: 2026-05-18 (機能完全形達成 60/60 + OGP 全配置後の品質保証準備)
 * 実機実行予定: 2026-05-19 (火) 統合テスト Day 1
 *
 * 仕様:
 *   - 期待値の真実のソース = eic-data-pipeline の data/catalog/indicators.json (raw URL)
 *   - hard-code 禁止: catalog raw URL から indicator_count を動的取得 (122 系列)
 *   - 7 endpoints チェック:
 *     1. /api/catalog               → indicators.length === catalog raw indicator_count
 *     2. /api/indicator/jepx-spot-tokyo       → data.length > 0 + meta.count 整合
 *     3. /api/indicator/us-fed-funds-rate     → data.length > 0 + meta.count 整合
 *     4. /api/indicator/fx-usdjpy-monthly-avg → data.length > 0 + meta.count 整合
 *     5. /api/usage-stats           → HTTP 200 + apiReq/csvDl/citeCopy キー存在
 *     6. /api/og/insight/fed-funds-vs-fx → HTTP 200 + content-type image/png
 *     7. /api/og/catalog/jepx-spot-tokyo → HTTP 200 + content-type image/png
 *
 * 使用:
 *   pnpm dlx tsx scripts/api-data-consistency.ts
 *   pnpm dlx tsx scripts/api-data-consistency.ts --base http://localhost:3000
 */

const DEFAULT_BASE = "https://data.eic-jp.org";
const CATALOG_RAW =
  "https://raw.githubusercontent.com/kenjieda-eng/eic-data-pipeline/main/data/catalog/indicators.json";
const TIMEOUT_MS = 15_000;

interface Check {
  name: string;
  run: () => Promise<{ pass: boolean; detail: string }>;
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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    throw new Error(`fetch failed ${url}: HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

interface CatalogShape {
  indicator_count: number;
  schema: string;
  version: number;
  generated_at: string;
  indicators: Array<{ id: string; observation_cutoff?: string }>;
}

interface IndicatorApiShape {
  id: string;
  data?: Array<{ date: string; value: number | null }>;
  meta?: { range?: { count?: number } };
}

interface UsageStatsShape {
  apiReq?: unknown;
  csvDl?: unknown;
  citeCopy?: unknown;
  [k: string]: unknown;
}

async function main(): Promise<void> {
  const { base } = parseArgs();
  console.log(`[api-data-consistency] base = ${base}`);

  // === 期待値の真実のソース ===
  console.log(`[api-data-consistency] fetching expected values from ${CATALOG_RAW}`);
  const expectedCatalog = await fetchJson<CatalogShape>(CATALOG_RAW);
  const expectedCount = expectedCatalog.indicator_count;
  console.log(`[api-data-consistency] expected indicator_count = ${expectedCount}`);

  const checks: Check[] = [
    {
      name: "1. GET /api/catalog → indicators.length === expected",
      async run() {
        const data = await fetchJson<CatalogShape>(`${base}/api/catalog`);
        const actual = data.indicators?.length ?? 0;
        return {
          pass: actual === expectedCount,
          detail: `expected=${expectedCount} actual=${actual} schema=${data.schema}`,
        };
      },
    },
    {
      name: "2. GET /api/indicator/jepx-spot-tokyo → data.length > 0 + meta.count 整合",
      async run() {
        const data = await fetchJson<IndicatorApiShape>(
          `${base}/api/indicator/jepx-spot-tokyo`,
        );
        const len = data.data?.length ?? 0;
        const metaCount = data.meta?.range?.count ?? -1;
        return {
          pass: len > 0 && len === metaCount,
          detail: `data.length=${len} meta.count=${metaCount}`,
        };
      },
    },
    {
      name: "3. GET /api/indicator/us-fed-funds-rate → data.length > 0 + meta.count 整合",
      async run() {
        const data = await fetchJson<IndicatorApiShape>(
          `${base}/api/indicator/us-fed-funds-rate`,
        );
        const len = data.data?.length ?? 0;
        const metaCount = data.meta?.range?.count ?? -1;
        return {
          pass: len > 0 && len === metaCount,
          detail: `data.length=${len} meta.count=${metaCount}`,
        };
      },
    },
    {
      name: "4. GET /api/indicator/fx-usdjpy-monthly-avg → data.length > 0 + meta.count 整合",
      async run() {
        const data = await fetchJson<IndicatorApiShape>(
          `${base}/api/indicator/fx-usdjpy-monthly-avg`,
        );
        const len = data.data?.length ?? 0;
        const metaCount = data.meta?.range?.count ?? -1;
        return {
          pass: len > 0 && len === metaCount,
          detail: `data.length=${len} meta.count=${metaCount}`,
        };
      },
    },
    {
      name: "5. GET /api/usage-stats → apiReq/csvDl/citeCopy キー存在",
      async run() {
        const data = await fetchJson<UsageStatsShape>(`${base}/api/usage-stats`);
        const keys = ["apiReq", "csvDl", "citeCopy"] as const;
        const missing = keys.filter((k) => !(k in data));
        return {
          pass: missing.length === 0,
          detail: `missing=[${missing.join(",")}] keys=[${Object.keys(data).join(",")}]`,
        };
      },
    },
    {
      name: "6. GET /api/og/insight/fed-funds-vs-fx → HTTP 200 + image/png",
      async run() {
        const res = await fetch(`${base}/api/og/insight/fed-funds-vs-fx`, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        const ct = res.headers.get("content-type") ?? "";
        return {
          pass: res.ok && ct.includes("image/png"),
          detail: `status=${res.status} content-type=${ct}`,
        };
      },
    },
    {
      name: "7. GET /api/og/catalog/jepx-spot-tokyo → HTTP 200 + image/png",
      async run() {
        const res = await fetch(`${base}/api/og/catalog/jepx-spot-tokyo`, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        const ct = res.headers.get("content-type") ?? "";
        return {
          pass: res.ok && ct.includes("image/png"),
          detail: `status=${res.status} content-type=${ct}`,
        };
      },
    },
  ];

  const results: Array<{ name: string; pass: boolean; detail: string; error?: string }> = [];
  for (const check of checks) {
    try {
      const r = await check.run();
      results.push({ name: check.name, ...r });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ name: check.name, pass: false, detail: "", error: msg });
    }
  }

  console.log("\n=== API Data Consistency Check Results ===");
  for (const r of results) {
    const icon = r.pass ? "✅" : "❌";
    console.log(`${icon} ${r.name}`);
    if (r.detail) console.log(`     ${r.detail}`);
    if (r.error) console.log(`     ERROR: ${r.error}`);
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n[api-data-consistency] total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`);
  if (failed.length > 0) {
    process.exit(1);
  }
  console.log("🎉 All API consistency checks passed");
}

main().catch((e) => {
  console.error("[api-data-consistency] fatal:", e);
  process.exit(1);
});

export {};
