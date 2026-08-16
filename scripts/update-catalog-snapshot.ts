/**
 * catalog 系列 id スナップショット (src/lib/__fixtures__/catalog-ids.json) の更新スクリプト。
 *
 * 何のためのスナップショットか:
 *   記事 MDX の `](/catalog/<id>)` リンク・チャート props の系列 id・`/compare?ids=` は
 *   すべて pipeline 側 catalog の実在 id を指していなければならない。しかし catalog は
 *   ビルド時にリモート取得されるため、テストからは「実在するか」を直接確かめられない。
 *   そこで catalog の id 集合だけをスナップショットとしてコミットし、
 *   src/lib/catalog-ids.test.ts が完全オフラインで照合できるようにする。
 *
 * ★ 運用ルール（最重要）★
 *   pipeline に新系列を追加した直後に記事がそれを参照する場合、
 *   同じ PR で `pnpm catalog:snapshot` を実行して fixture も更新すること。
 *   （fixture が古いままだと、実在する新系列を参照した記事が
 *     catalog-ids.test.ts で「存在しない id」として赤くなる）
 *
 *   逆に、fixture にあって live catalog に無い id（系列の退役）は
 *   スナップショット照合では検知できない。そちらは
 *   `scripts/api-data-consistency.ts`（案B: 陳腐化検知）が両方向で報告する。
 *
 * 使用:
 *   pnpm catalog:snapshot
 *   pnpm catalog:snapshot --check   # 書き換えずに差分の有無だけ判定 (差分ありで exit 1)
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CATALOG_RAW =
  "https://raw.githubusercontent.com/kenjieda-eng/eic-data-pipeline/main/data/catalog/indicators.json";
const TIMEOUT_MS = 30_000;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.resolve(
  HERE,
  "../src/lib/__fixtures__/catalog-ids.json",
);

interface CatalogShape {
  indicator_count?: number;
  indicators?: Array<{ id?: unknown }>;
}

interface Snapshot {
  $comment: string;
  source: string;
  count: number;
  ids: string[];
}

const FIXTURE_COMMENT =
  "自動生成。手で編集しない。pipeline に系列を追加/削除したら同じ PR で `pnpm catalog:snapshot` を実行する。";

function buildSnapshot(ids: string[]): Snapshot {
  return {
    $comment: FIXTURE_COMMENT,
    source: CATALOG_RAW,
    count: ids.length,
    ids,
  };
}

function serialize(snapshot: Snapshot): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

function readCurrentIds(): string[] | null {
  try {
    const parsed = JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as Snapshot;
    return Array.isArray(parsed.ids) ? parsed.ids : null;
  } catch {
    return null; // 初回生成
  }
}

async function fetchCatalogIds(): Promise<string[]> {
  const res = await fetch(CATALOG_RAW, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`fetch failed ${CATALOG_RAW}: HTTP ${res.status}`);
  }
  const catalog = (await res.json()) as CatalogShape;

  const indicators = catalog.indicators;
  if (!Array.isArray(indicators) || indicators.length === 0) {
    throw new Error("catalog.indicators が配列でないか空です（取得失敗の疑い）");
  }

  const ids = indicators.map((i) => i.id);
  if (ids.some((id) => typeof id !== "string" || !id)) {
    throw new Error("catalog.indicators に id を持たない要素があります");
  }

  const sorted = (ids as string[]).slice().sort();
  const unique = new Set(sorted);
  if (unique.size !== sorted.length) {
    throw new Error(
      `catalog に重複 id があります (${sorted.length} 件中 unique ${unique.size} 件)`,
    );
  }
  if (
    typeof catalog.indicator_count === "number" &&
    catalog.indicator_count !== sorted.length
  ) {
    throw new Error(
      `indicator_count (${catalog.indicator_count}) と indicators.length (${sorted.length}) が不一致`,
    );
  }
  return sorted;
}

async function main(): Promise<void> {
  const checkOnly = process.argv.slice(2).includes("--check");

  console.log(`[catalog:snapshot] fetching ${CATALOG_RAW}`);
  const ids = await fetchCatalogIds();
  console.log(`[catalog:snapshot] live catalog = ${ids.length} 系列`);

  const before = readCurrentIds();
  const next = serialize(buildSnapshot(ids));

  if (before === null) {
    console.log("[catalog:snapshot] 既存 fixture なし → 新規作成");
  } else {
    const beforeSet = new Set(before);
    const afterSet = new Set(ids);
    const added = ids.filter((id) => !beforeSet.has(id));
    const removed = before.filter((id) => !afterSet.has(id));
    console.log(
      `[catalog:snapshot] fixture ${before.length} → ${ids.length} 系列 (追加 ${added.length} / 削除 ${removed.length})`,
    );
    for (const id of added) console.log(`  + ${id}`);
    for (const id of removed) console.log(`  - ${id}`);
    if (added.length === 0 && removed.length === 0) {
      console.log("[catalog:snapshot] 差分なし");
      if (checkOnly) return;
    } else if (checkOnly) {
      console.error(
        "[catalog:snapshot] --check: fixture が live catalog と乖離しています。`pnpm catalog:snapshot` を実行してください。",
      );
      process.exit(1);
    }
  }

  if (checkOnly) return;

  mkdirSync(path.dirname(FIXTURE_PATH), { recursive: true });
  writeFileSync(FIXTURE_PATH, next, "utf8");
  console.log(`[catalog:snapshot] wrote ${path.relative(process.cwd(), FIXTURE_PATH)}`);
}

main().catch((e) => {
  console.error("[catalog:snapshot] fatal:", e);
  process.exit(1);
});

export {};
