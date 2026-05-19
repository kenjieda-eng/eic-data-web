/**
 * ブラウザ互換 smoke test - 11 機能 × 4 ブラウザ UA = 44 ケース (server-side 検証)
 *
 * 起草: 2026-05-19 (火) 統合テスト Day 3
 *
 * 仕様:
 *   - 4 ブラウザ (Chrome / Edge / Safari / Firefox) の User-Agent でリクエスト
 *   - HTTP status / content-type / 必須マーカー (HTML title 等) を検証
 *   - リダイレクト (308) は自動追跡 (curl -L 相当)
 *   - 11 機能の URL は本番 https://data.eic-jp.org に対して実施
 *
 * スコープ:
 *   - server-side 互換性 = 100% カバー (44 ケース)
 *   - 真のブラウザレンダリング (Chrome Headless 経由) は本機 Playwright 未導入のため、
 *     /, /insight/, /insight/fed-funds-vs-fx/, /catalog/, /data-quality/ の 5 URL は
 *     scripts/lighthouse-5url-check.ts で Chrome Headless 実行済 (Day 2 で 5/5 PASS 確認)
 *   - インタラクティブ機能 (引用コピー / CSV DL / 検索 JS / 用語集グラフ canvas) は
 *     真のブラウザ操作が必要 → EDA さん手動確認に申し送り
 *
 * 使用:
 *   pnpm dlx tsx scripts/browser-compat-smoke.ts
 *   pnpm dlx tsx scripts/browser-compat-smoke.ts --base http://localhost:3000
 */

const DEFAULT_BASE = "https://data.eic-jp.org";
const TIMEOUT_MS = 20_000;

interface UrlSpec {
  /** 表示名 (機能名) */
  name: string;
  /** path (base からの相対) */
  path: string;
  /** 期待 content-type substring (HTML / image/png 等) */
  expectContentType: string;
  /** HTML body に含まれていることを期待するマーカー (1 つでも該当すれば PASS) */
  expectMarkers?: string[];
  /** image など、HTML マーカー検証をスキップする場合 true */
  binary?: boolean;
  /** 最小 body サイズ (binary 用) */
  minBytes?: number;
}

const UAS: Record<string, string> = {
  Chrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Edge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  Safari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  Firefox:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
};

const URLS: UrlSpec[] = [
  {
    name: "1. TOP",
    path: "/",
    expectContentType: "text/html",
    expectMarkers: ["EIC Data", "<html"],
  },
  {
    name: "2. Insight 詳細",
    path: "/insight/fed-funds-vs-fx/",
    expectContentType: "text/html",
    expectMarkers: ["FRB", "FF", "USD/JPY", "fed-funds"],
  },
  {
    name: "3. catalog 詳細",
    path: "/catalog/jepx-spot-tokyo/",
    expectContentType: "text/html",
    expectMarkers: ["JEPX", "東京", "jepx-spot-tokyo"],
  },
  {
    name: "4. 引用コピー UI (Insight 詳細内)",
    path: "/insight/fed-funds-vs-fx/",
    expectContentType: "text/html",
    expectMarkers: ["BibTeX", "Chicago", "APA", "引用"],
  },
  {
    name: "5. CSV DL UI (catalog 詳細内)",
    path: "/catalog/jepx-spot-tokyo/",
    expectContentType: "text/html",
    expectMarkers: ["CSV", "ダウンロード", "download"],
  },
  {
    name: "6. iframe Embed Widget",
    path: "/embed/jepx-spot-tokyo",
    expectContentType: "text/html",
    expectMarkers: ["jepx-spot-tokyo", "<html"],
  },
  {
    name: "7. Newsletter 購読フォーム (TOP に embed、/newsletter は独立ルートなし)",
    path: "/",
    expectContentType: "text/html",
    expectMarkers: ["newsletter-subscribe-heading", "購読", "Newsletter"],
  },
  {
    name: "8. 検索 (q=LNG)",
    path: "/search?q=LNG",
    expectContentType: "text/html",
    expectMarkers: ["検索", "LNG", "search"],
  },
  {
    name: "9. 用語集グラフ",
    path: "/glossary/graph",
    expectContentType: "text/html",
    expectMarkers: ["用語集", "glossary", "<html"],
  },
  {
    name: "10. OG カード API",
    path: "/api/og/insight/fed-funds-vs-fx",
    expectContentType: "image/png",
    binary: true,
    minBytes: 10_000,
  },
  {
    name: "11. プライバシーポリシー",
    path: "/privacy",
    expectContentType: "text/html",
    expectMarkers: ["プライバシー", "Privacy", "個人情報"],
  },
];

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

interface CheckResult {
  url: string;
  ua: string;
  pass: boolean;
  detail: string;
}

async function checkOne(
  base: string,
  spec: UrlSpec,
  uaLabel: string,
  uaString: string,
): Promise<CheckResult> {
  const url = `${base}${spec.path}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": uaString, Accept: "*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      return {
        url: spec.path,
        ua: uaLabel,
        pass: false,
        detail: `HTTP ${res.status}`,
      };
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes(spec.expectContentType)) {
      return {
        url: spec.path,
        ua: uaLabel,
        pass: false,
        detail: `content-type=${ct} (expected ${spec.expectContentType})`,
      };
    }
    if (spec.binary) {
      const buf = await res.arrayBuffer();
      const ok = buf.byteLength >= (spec.minBytes ?? 1000);
      return {
        url: spec.path,
        ua: uaLabel,
        pass: ok,
        detail: `bytes=${buf.byteLength}${ok ? "" : ` < ${spec.minBytes}`}`,
      };
    }
    const body = await res.text();
    const markers = spec.expectMarkers ?? [];
    const hit = markers.find((m) => body.includes(m));
    if (!hit && markers.length > 0) {
      return {
        url: spec.path,
        ua: uaLabel,
        pass: false,
        detail: `no marker matched (looked for: ${markers.join(", ")})`,
      };
    }
    return {
      url: spec.path,
      ua: uaLabel,
      pass: true,
      detail: `HTTP 200 ${ct.split(";")[0]} marker=\"${hit ?? "(none required)"}\" bytes=${body.length}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      url: spec.path,
      ua: uaLabel,
      pass: false,
      detail: `fetch error: ${msg}`,
    };
  }
}

async function main(): Promise<void> {
  const { base } = parseArgs();
  console.log(`[browser-compat-smoke] base = ${base}`);
  console.log(`[browser-compat-smoke] testing ${URLS.length} URLs × ${Object.keys(UAS).length} UAs = ${URLS.length * Object.keys(UAS).length} cases`);

  const results: CheckResult[] = [];
  for (const spec of URLS) {
    console.log(`\n${spec.name}  (${spec.path})`);
    for (const [uaLabel, uaString] of Object.entries(UAS)) {
      const r = await checkOne(base, spec, uaLabel, uaString);
      results.push(r);
      const icon = r.pass ? "✅" : "❌";
      console.log(`  ${icon} ${uaLabel.padEnd(8)} ${r.detail}`);
    }
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n[browser-compat-smoke] total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`);
  if (failed.length > 0) {
    console.log("\n=== Failures ===");
    for (const f of failed) console.log(`  ❌ ${f.url} [${f.ua}] ${f.detail}`);
    process.exit(1);
  }
  console.log("🎉 All 44 server-side compat cases passed");
  console.log("\nNote: interactive features (引用コピー, CSV DL, 検索 JS, 用語集グラフ canvas) require real browser operation.");
  console.log("      → 5/19 火曜午後の EDA さん手動確認 (Safari/iPhone + Firefox) で補完を推奨。");
}

main().catch((e) => {
  console.error("[browser-compat-smoke] fatal:", e);
  process.exit(1);
});

export {};
