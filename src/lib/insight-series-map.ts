import fs from "node:fs";
import path from "node:path";
import { INSIGHTS } from "./insights";

/**
 * T1-4 SEO 内部リンク: catalog 個別ページの行き止まり解消。
 *
 * ビルド時に `src/app/insight/<slug>/page.mdx` を全件読み、各 MDX が参照する
 * 系列 id を抽出して「系列 id → その系列を使った Insight」の逆引きマップを作る。
 * catalog/[id] ページから `getInsightsForSeries(indicator.id)` を呼び、関連
 * Insight への内部リンクを描画するために使う。
 *
 * 安全性: 読み込み / 正規表現で何が起きても空配列を返し、catalog ページを壊さない。
 */

export interface RelatedInsight {
  slug: string;
  title: string;
}

/**
 * チャート系コンポーネントが catalog 系列 id を受け取る単一値プロップ。
 * 大文字小文字を区別してマッチするので、小文字の `id` (ChartLine) が
 * camelCase の `leftId` / `lagId` 等と衝突しない。
 *
 * - ChartLine:     id
 * - ChartDual:     leftId / rightId
 * - ChartLagBars:  leadId / lagId
 * - ChartSpread:   spreadAId / spreadBId / comparisonId(任意)
 * - ChartDecomp:   factorAId / factorBId
 *
 * ChartHeatmap の indicatorIds={[...]} は配列なので別処理。
 * BalancingProductsCompareChart は系列 id をコンポーネント内にハードコード
 * しており props を取らないため、ここでは graceful に取りこぼす(意図通り)。
 */
const SINGLE_ID_PROPS = [
  "id",
  "leftId",
  "rightId",
  "leadId",
  "lagId",
  "spreadAId",
  "spreadBId",
  "comparisonId",
  "factorAId",
  "factorBId",
] as const;

/** 1 本の MDX 本文から参照系列 id を重複なしで抽出する。 */
function extractSeriesIds(mdx: string): string[] {
  const ids = new Set<string>();

  // 単一値プロップ: propName="series-id"
  // プロップ名の直前が英字でないことを保証し、`id` が `leftId` 等の末尾に
  // 誤マッチしないようにする(大文字小文字区別と二重の安全策)。
  for (const prop of SINGLE_ID_PROPS) {
    const re = new RegExp(`(?<![A-Za-z])${prop}="([^"]+)"`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(mdx)) !== null) {
      ids.add(m[1]);
    }
  }

  // ChartHeatmap: indicatorIds={[ "id-a", "id-b", ... ]}(複数行可)
  const heatmapRe = /indicatorIds=\{\[([\s\S]*?)\]\}/g;
  let hm: RegExpExecArray | null;
  while ((hm = heatmapRe.exec(mdx)) !== null) {
    const inner = hm[1];
    const strRe = /"([^"]+)"/g;
    let s: RegExpExecArray | null;
    while ((s = strRe.exec(inner)) !== null) {
      ids.add(s[1]);
    }
  }

  return [...ids];
}

/** 系列 id → 関連 Insight[] のマップをビルド時に一度だけ構築する。 */
function buildMap(): Map<string, RelatedInsight[]> {
  const map = new Map<string, RelatedInsight[]>();
  try {
    const insightDir = path.join(process.cwd(), "src", "app", "insight");
    const titleBySlug = new Map(INSIGHTS.map((i) => [i.slug, i.title] as const));

    const entries = fs
      .readdirSync(insightDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name)); // 決定的な並び

    for (const entry of entries) {
      const slug = entry.name;
      // slug→title は公開 Insight 一覧(INSIGHTS)から引く。
      // 一覧に無い slug(draft 等)はタイトルが無いので関連リンク対象外。
      const title = titleBySlug.get(slug);
      if (!title) continue;

      let mdx: string;
      try {
        mdx = fs.readFileSync(path.join(insightDir, slug, "page.mdx"), "utf8");
      } catch {
        continue; // page.mdx が無いディレクトリはスキップ
      }

      let seriesIds: string[];
      try {
        seriesIds = extractSeriesIds(mdx);
      } catch {
        seriesIds = []; // 正規表現で何かあっても 1 本だけ諦める
      }

      for (const sid of seriesIds) {
        const list = map.get(sid);
        if (list) {
          if (!list.some((r) => r.slug === slug)) {
            list.push({ slug, title });
          }
        } else {
          map.set(sid, [{ slug, title }]);
        }
      }
    }
  } catch {
    return new Map(); // ディレクトリが読めない等 → 空マップ
  }
  return map;
}

let cached: Map<string, RelatedInsight[]> | null = null;

function getMap(): Map<string, RelatedInsight[]> {
  if (cached === null) {
    cached = buildMap();
  }
  return cached;
}

/**
 * 指定した系列 id を使っている Insight の一覧を返す。
 * マッチが無ければ空配列。同一 slug は排除済み。
 * 何が起きても例外を投げず空配列を返す(catalog ページを壊さない)。
 */
export function getInsightsForSeries(seriesId: string): RelatedInsight[] {
  try {
    if (!seriesId) return [];
    const list = getMap().get(seriesId);
    return list ? list.slice() : [];
  } catch {
    return [];
  }
}
