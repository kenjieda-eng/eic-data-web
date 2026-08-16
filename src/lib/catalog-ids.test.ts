import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { extractSeriesIds } from "./insight-series-map";
import { KNOWN_STALE } from "./known-stale";
import { MORNING_SUMMARIES } from "./morning-summary-data";
import { JEPX_9_REGION_IDS, WATCH_KPIS } from "./watch-data";

// catalog 系列 id 参照の常設ガード（案A: スナップショット照合）。
//
// 背景: 2026-08-15 の全記事 /catalog 参照・チャート ID 総点検で、記事 MDX が
// 参照する系列 id を CI で検証する仕組みが無いことが分かった。internal-links.test.ts
// は「/catalog/<id> は catalog がビルド時リモート取得のため検証不可」として
// skip しており、存在しない系列を指すリンク・チャートは本番で初めて壊れる。
//
// 対策: pipeline 側 catalog の id 集合だけを fixture としてコミットし
// (src/lib/__fixtures__/catalog-ids.json, `pnpm catalog:snapshot` で更新)、
// 記事とコード内ハードコードの系列 id をそれと照合する。
// 完全オフライン・決定的（ネットワーク非依存）。
//
// 案A の弱点（fixture が live catalog から陳腐化する / 系列退役に気付けない）は
// scripts/api-data-consistency.ts の「fixture vs live catalog」双方向差分が補う。
//
// 検証対象:
//   - 公開 Insight MDX: src/app/insight/<slug>/page.mdx （107 本）
//       ① ](/catalog/<id>) リンク
//       ② チャート系 props の系列 id（extractSeriesIds を insight-series-map から再利用）
//       ③ /compare?ids=<id>,<id>,… の系列 id
//   - MDX 外ハードコード群（下の HARDCODED_* を参照）
//
// 検証対象外:
//   - src/content/drafts/**（未公開ドラフト。catalog 未着地の系列を意図的に含む）
//   - src/content/insight-template.mdx（雛形）
//   - *.test.ts 内の系列 id（"this-series-does-not-exist" 等、存在しない id を
//     わざと使うテストがあるため）
//   - scripts/**（開発ツール。本番ページを壊さない）

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(HERE, "..");
const INSIGHT_DIR = path.join(SRC_DIR, "app", "insight");
const FIXTURE_PATH = path.join(HERE, "__fixtures__", "catalog-ids.json");

// -----------------------------------------------------------------------------
// 有効 ID 集合 = catalog id（fixture）+ derived 系列 id（web 側で合成する指標）
// -----------------------------------------------------------------------------

interface CatalogIdSnapshot {
  $comment: string;
  source: string;
  count: number;
  ids: string[];
}

const SNAPSHOT = JSON.parse(
  readFileSync(FIXTURE_PATH, "utf8"),
) as CatalogIdSnapshot;

const CATALOG_IDS = new Set(SNAPSHOT.ids);

/**
 * catalog に存在しないが web 側で合成される派生系列 id。
 * 実測 (2026-08-16, `grep -rn "derived:" src`) では本番コードに 1 件のみ:
 *   - derived:jepx-9-region-avg … WATCH_KPIS (src/lib/watch-data.ts) の JEPX 全国平均
 * src/lib/derived.ts の fetchYenLng / fetchRateSpread も派生系列を作るが、
 * こちらは id を持たず（チャートが元系列 id から都度計算する）参照対象にならない。
 * ★ 新しい "derived:xxx" を足したらここにも追記すること。
 */
const DERIVED_IDS = ["derived:jepx-9-region-avg"] as const;

const VALID_IDS = new Set<string>([...CATALOG_IDS, ...DERIVED_IDS]);

// -----------------------------------------------------------------------------
// 参照の収集
// -----------------------------------------------------------------------------

type RefKind = "link" | "chart" | "compare" | "hardcoded";

interface SeriesRef {
  /** 参照元（表示用の相対パス or ハードコード site 名） */
  where: string;
  kind: RefKind;
  id: string;
}

/** ](/catalog/<id>) のマークダウンリンクから系列 id を取り出す（重複除去しない）。 */
export function extractCatalogLinkIds(markdown: string): string[] {
  const re = /\]\(\s*\/catalog\/([^)\s#?]+)/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    out.push(decodeURIComponent(m[1]));
  }
  return out;
}

/** /compare?ids=a,b,c から系列 id を取り出す（重複除去しない）。 */
export function extractCompareIds(markdown: string): string[] {
  const re = /\/compare\?ids=([^)\s"'&]+)/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    for (const id of decodeURIComponent(m[1]).split(",")) {
      const trimmed = id.trim();
      if (trimmed) out.push(trimmed);
    }
  }
  return out;
}

/** src/app/insight/<slug>/page.mdx を全列挙（page.tsx のハブは対象外）。 */
function listMdxFiles(): string[] {
  return readdirSync(INSIGHT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(INSIGHT_DIR, d.name, "page.mdx"))
    .filter((p) => existsSync(p))
    .sort();
}

function collectMdxRefs(): { files: string[]; refs: SeriesRef[] } {
  const files = listMdxFiles();
  const refs: SeriesRef[] = [];
  for (const file of files) {
    const where = path.relative(INSIGHT_DIR, file).replace(/\\/g, "/");
    const mdx = readFileSync(file, "utf8");
    for (const id of extractCatalogLinkIds(mdx)) {
      refs.push({ where, kind: "link", id });
    }
    // extractSeriesIds は 1 ファイル内で重複除去して返す（本番の逆引きマップと同じ挙動）。
    for (const id of extractSeriesIds(mdx)) {
      refs.push({ where, kind: "chart", id });
    }
    for (const id of extractCompareIds(mdx)) {
      refs.push({ where, kind: "compare", id });
    }
  }
  return { files, refs };
}

// -----------------------------------------------------------------------------
// MDX 外ハードコード群
//
// 判断: 「記事だけでなくコードにも catalog id が直書きされており、退役・改名で
// 同じように本番ページが壊れる」ため対象に含める。ただし対象は本番描画に効く
// 定義だけに絞り、テスト・スクリプト・プレフィックス判定 (id.startsWith("meti-")
// 等の部分文字列) は含めない。
//
//   a. 名前付き export があるもの → 直接 import して検証（正規表現不要で堅牢）
//   b. ページ / クライアントコンポーネント内の非 export const
//      → 定数名でアンカーした配列リテラル走査（import すると Next/echarts を
//        引き込むため。定数名が変わったら件数下限で赤くなる）
// -----------------------------------------------------------------------------

/** catalog id の字形。fixture 590 件すべてがこの形（実測）。 */
const SERIES_ID_SHAPE = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;

/**
 * `const <NAME> ... = [ ... ]` の配列リテラル内から系列 id 形の文字列を拾う。
 * 型注釈に含まれる `[]`（例: `{ id: string }[] = [`）を踏まないよう、
 * 代入 `=` の後ろの最初の `[` からブラケット対応で切り出す。
 */
export function extractConstArrayIds(source: string, constName: string): string[] {
  const declIdx = source.search(new RegExp(`(?<![A-Za-z0-9_$])const\\s+${constName}\\b`));
  if (declIdx === -1) return [];
  const eqIdx = source.indexOf("=", declIdx);
  if (eqIdx === -1) return [];
  const openIdx = source.indexOf("[", eqIdx);
  if (openIdx === -1) return [];

  let depth = 0;
  let closeIdx = -1;
  for (let i = openIdx; i < source.length; i++) {
    const ch = source[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        closeIdx = i;
        break;
      }
    }
  }
  if (closeIdx === -1) return [];

  const body = source.slice(openIdx, closeIdx + 1);
  const out: string[] = [];
  const strRe = /"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = strRe.exec(body)) !== null) {
    if (SERIES_ID_SHAPE.test(m[1])) out.push(m[1]);
  }
  return out;
}

/**
 * 走査対象の非 export const。
 * `min` は現在の実測件数。リストを意図的に増減したらここも更新すること
 * （定数名の改名・削除で走査が空振りしたら赤くなる番人）。
 */
const SCANNED_CONSTS: { file: string; constName: string; min: number }[] = [
  // TOP ページの主要指標 12 系列（/catalog/<id> へのリンクとスパークラインを描く）
  { file: "app/page.tsx", constName: "KEY_INDICATORS", min: 12 },
  // 需給調整市場ページ: 6 商品 × (約定価格 / 不足率)
  { file: "app/markets/balancing/page.tsx", constName: "PRODUCT_IDS", min: 6 },
  { file: "app/markets/balancing/page.tsx", constName: "SHORTAGE_IDS", min: 6 },
  // 記事から使う需給調整市場 6 商品比較チャート（props を取らず内部にハードコード）
  {
    file: "components/BalancingProductsCompareChart.tsx",
    constName: "PRODUCT_IDS",
    min: 6,
  },
];

function collectHardcodedRefs(): {
  refs: SeriesRef[];
  scanned: { label: string; found: number; min: number }[];
} {
  const refs: SeriesRef[] = [];
  const scanned: { label: string; found: number; min: number }[] = [];

  // (a) 名前付き export からの直接検証
  for (const kpi of WATCH_KPIS) {
    refs.push({ where: "lib/watch-data.ts WATCH_KPIS", kind: "hardcoded", id: kpi.id });
    for (const src of kpi.derivedFrom ?? []) {
      refs.push({
        where: "lib/watch-data.ts WATCH_KPIS.derivedFrom",
        kind: "hardcoded",
        id: src,
      });
    }
  }
  for (const id of JEPX_9_REGION_IDS) {
    refs.push({ where: "lib/watch-data.ts JEPX_9_REGION_IDS", kind: "hardcoded", id });
  }
  for (const id of Object.keys(KNOWN_STALE)) {
    refs.push({ where: "lib/known-stale.ts KNOWN_STALE", kind: "hardcoded", id });
  }
  for (const [date, summary] of Object.entries(MORNING_SUMMARIES)) {
    for (const line of summary.lines) {
      refs.push({
        where: `lib/morning-summary-data.ts MORNING_SUMMARIES[${date}]`,
        kind: "hardcoded",
        id: line.indicatorId,
      });
    }
  }

  // (b) 非 export const の走査
  for (const { file, constName, min } of SCANNED_CONSTS) {
    const source = readFileSync(path.join(SRC_DIR, file), "utf8");
    const ids = extractConstArrayIds(source, constName);
    const label = `${file} ${constName}`;
    scanned.push({ label, found: ids.length, min });
    for (const id of ids) {
      refs.push({ where: label, kind: "hardcoded", id });
    }
  }

  return { refs, scanned };
}

// -----------------------------------------------------------------------------

const { files: MDX_FILES, refs: MDX_REFS } = collectMdxRefs();
const { refs: HARDCODED_REFS, scanned: SCAN_RESULTS } = collectHardcodedRefs();
const ALL_REFS = [...MDX_REFS, ...HARDCODED_REFS];

const countOf = (kind: RefKind) => ALL_REFS.filter((r) => r.kind === kind).length;
const unknownOf = (kind: RefKind) =>
  ALL_REFS.filter((r) => r.kind === kind && !VALID_IDS.has(r.id));

function formatUnknown(items: SeriesRef[]): string {
  if (items.length === 0) return "(なし)";
  return items.map((r) => `  ${r.where}  →  ${r.id}`).join("\n");
}

const FIXTURE_HINT =
  "catalog に実在する新系列なら `pnpm catalog:snapshot` で fixture を更新、" +
  "誤記・退役なら参照側を修正すること。";

describe("catalog 系列 id スナップショット (fixture)", () => {
  test("fixture が 500 系列以上・ソート済み・重複なしで読める", () => {
    expect(SNAPSHOT.ids.length).toBeGreaterThanOrEqual(500);
    expect(SNAPSHOT.count).toBe(SNAPSHOT.ids.length);
    expect(new Set(SNAPSHOT.ids).size).toBe(SNAPSHOT.ids.length);
    expect(SNAPSHOT.ids).toEqual([...SNAPSHOT.ids].sort());
  });

  test("derived 系列 id は catalog id と衝突しない", () => {
    for (const id of DERIVED_IDS) {
      expect(CATALOG_IDS.has(id), `${id} は catalog にも存在する`).toBe(false);
    }
  });
});

describe("参照抽出（空走で緑にならないための番人）", () => {
  // 2026-08-15 総点検の実測値を下限にする。具体値そのものではなく
  // 「大きく下回ったら抽出が壊れている」を検出する。
  test("公開 Insight MDX を実際に走査できている（実測 107 本）", () => {
    expect(MDX_FILES.length).toBeGreaterThanOrEqual(90);
  });

  test("](/catalog/<id>) リンクを抽出できている（実測 36 件）", () => {
    expect(countOf("link")).toBeGreaterThanOrEqual(30);
  });

  test("チャート系 props の系列 id を抽出できている（実測: 出現 306 / ファイル内重複除去後 268）", () => {
    // extractSeriesIds は 1 ファイル内で重複除去するので合計は 268。
    expect(countOf("chart")).toBeGreaterThanOrEqual(220);
  });

  test("/compare?ids= の系列 id を抽出できている（実測 12 件）", () => {
    expect(countOf("compare")).toBeGreaterThanOrEqual(10);
  });

  // 内訳（実測）: WATCH_KPIS 12 + derivedFrom 9 + JEPX_9_REGION_IDS 9
  //              + KNOWN_STALE 6 + MORNING_SUMMARIES 25 + 走査 const 30 = 91
  test("MDX 外ハードコードの系列 id を抽出できている（実測 91 件）", () => {
    expect(countOf("hardcoded")).toBeGreaterThanOrEqual(80);
  });

  test("走査対象の const がすべて見つかり、期待件数を満たす", () => {
    for (const { label, found, min } of SCAN_RESULTS) {
      expect(
        found,
        `${label} から系列 id を ${min} 件以上拾えていない（定数名の改名・削除の疑い）`,
      ).toBeGreaterThanOrEqual(min);
    }
  });
});

describe("catalog 系列 id 照合（恒久ガード）", () => {
  test("](/catalog/<id>) リンクの系列 id がすべて実在する", () => {
    const items = unknownOf("link");
    expect(
      items,
      `catalog に存在しない系列を指す /catalog リンク（${items.length} 件）。${FIXTURE_HINT}\n${formatUnknown(items)}`,
    ).toHaveLength(0);
  });

  test("チャート系 props の系列 id がすべて実在する", () => {
    const items = unknownOf("chart");
    expect(
      items,
      `catalog に存在しない系列を指すチャート props（${items.length} 件）。${FIXTURE_HINT}\n${formatUnknown(items)}`,
    ).toHaveLength(0);
  });

  test("/compare?ids= の系列 id がすべて実在する", () => {
    const items = unknownOf("compare");
    expect(
      items,
      `catalog に存在しない系列を指す /compare?ids=（${items.length} 件）。${FIXTURE_HINT}\n${formatUnknown(items)}`,
    ).toHaveLength(0);
  });

  test("MDX 外ハードコードの系列 id がすべて実在する", () => {
    const items = unknownOf("hardcoded");
    expect(
      items,
      `catalog に存在しない系列をコードが直書きしている（${items.length} 件）。${FIXTURE_HINT}\n${formatUnknown(items)}`,
    ).toHaveLength(0);
  });
});

describe("抽出ヘルパ", () => {
  test("extractCatalogLinkIds: /catalog リンクのみを拾い、他のリンクは拾わない", () => {
    const md =
      "[a](/catalog/jepx-spot-tokyo) [b](/insight/foo) [c](/catalog/fuel-lng-jp-cif#chart) [d](https://x.test/catalog/z)";
    expect(extractCatalogLinkIds(md)).toEqual([
      "jepx-spot-tokyo",
      "fuel-lng-jp-cif",
    ]);
  });

  test("extractCompareIds: カンマ区切りを分解し、複数リンクを順に拾う", () => {
    const md = "[x](/compare?ids=a-one,b-two,c-three) と [y](/compare?ids=d-four)";
    expect(extractCompareIds(md)).toEqual(["a-one", "b-two", "c-three", "d-four"]);
  });

  test("extractCompareIds: 空要素は落とし、ids を持たない /compare は拾わない", () => {
    expect(extractCompareIds("[x](/compare?ids=a-one,,b-two)")).toEqual([
      "a-one",
      "b-two",
    ]);
    expect(extractCompareIds("[x](/compare) [y](/compare?foo=1)")).toEqual([]);
  });

  test("extractConstArrayIds: 型注釈の [] を踏まず配列本体だけを読む", () => {
    const src = [
      'const KEY: { id: string; color: string }[] = [',
      '  { id: "jepx-spot-tokyo", color: "#047857" },',
      '  { id: "fuel-lng-jp-cif", color: "#a16207" },',
      "];",
      'const OTHER = ["should-not-appear"];',
    ].join("\n");
    expect(extractConstArrayIds(src, "KEY")).toEqual([
      "jepx-spot-tokyo",
      "fuel-lng-jp-cif",
    ]);
  });

  test("extractConstArrayIds: 未知の定数名は空配列", () => {
    expect(extractConstArrayIds('const A = ["x-y"];', "NOPE")).toEqual([]);
  });
});
