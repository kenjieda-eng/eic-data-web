import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { GLOSSARY_TERMS } from "../app/glossary/data";
import { INSIGHTS } from "./insights";

// 内部リンク整合性の常設ガード。
// 全教材・全記事 MDX（src/app/insight/<slug>/page.mdx）に書かれた
// サイト内リンク ](/...) を走査し、リンク先が実在することを検証する。
// 2026-07-18 以来 merge のたびに手作業で slug を突き合わせていた確認を
// テストへ昇格し、壊れた内部リンクを CI で恒久的に検出する。
//
// 検証対象外（走査してスキップ）:
//   - 外部リンク http(s):// ・プロトコル相対 //host ・アンカーのみ #sec
//   - /catalog/<id>  … 系列はビルド時にリモート取得のため slug 検証不可
//   - /compare?ids=… … ids は catalog 系列を指すため同上
//   - /domain/<id>   … ドメイン別ページ（動的）
//   - /today/<date>  … 朝刊アーカイブ（日付動的、/today/archive は固定ページとして検証）

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INSIGHT_DIR = path.resolve(HERE, "../app/insight");

const INSIGHT_SLUGS = new Set(INSIGHTS.map((i) => i.slug));
const GLOSSARY_SLUGS = new Set(GLOSSARY_TERMS.map((t) => t.slug));

// Insight 配下の「記事でない」ルート／ハブページ。slug 検証の対象外で許可する。
const INSIGHT_ROOT_PATHS = new Set([
  "/insight",
  "/insight/map",
  "/insight/network",
  "/insight/guide",
]);

// 用語集配下の「用語でない」ページ（一覧と関係グラフ）。同上で許可する。
const GLOSSARY_ROOT_PATHS = new Set(["/glossary", "/glossary/graph"]);

// サイト内の固定（実在）ルート全列挙。insight/ ・glossary/ 配下は上の
// 専用ルールで検証するためここには含めない。動的ルートは上記のとおり対象外。
// ★ ページを追加したら、ここに追記すること（未登録だとテストが赤くなる）。
const FIXED_ROUTES = new Set([
  "/",
  "/catalog",
  "/citation-policy",
  "/cite",
  "/compare",
  "/data-quality",
  "/domain",
  "/editorial-calendar",
  "/en",
  "/map",
  "/markets",
  "/markets/balancing",
  "/methodology",
  "/pipeline-status",
  "/playground",
  "/privacy",
  "/search",
  "/terms",
  "/today",
  "/today/archive",
  "/usage-stats",
  "/watch",
  "/whats-new",
]);

// Markdown リンク ](/...) から、サイト内絶対パス（"/" 始まり）を抽出する。
// - 直後が "/" でないもの（外部 http(s)://・mailto:・アンカー #）は拾わない
// - プロトコル相対 //host も除外（"/" の直後が "/" でないことを要求）
// - タイトル付き ](/x "title") は URL 部分のみを取り出す（空白で切れる）
export function extractInternalLinks(markdown: string): string[] {
  const re = /\]\(\s*(\/(?!\/)[^)\s]*)/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    out.push(m[1]);
  }
  return out;
}

type LinkVerdict =
  | { kind: "ok" }
  | { kind: "skip" }
  | { kind: "broken"; category: "insight" | "glossary" | "fixed"; reason: string };

// 1 本のサイト内リンクを検証する。
export function verifyLink(raw: string): LinkVerdict {
  // 外部・プロトコル相対は対象外
  if (!raw.startsWith("/") || raw.startsWith("//")) return { kind: "skip" };

  // クエリ・ハッシュを分離し、末尾スラッシュを正規化
  const hashIdx = raw.search(/[?#]/);
  let pathname = hashIdx === -1 ? raw : raw.slice(0, hashIdx);
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, "");
  const hasQuery = raw.includes("?");
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // --- 動的ルートは検証対象外 ---
  if (first === "catalog" && segments.length >= 2) return { kind: "skip" }; // /catalog/<id>
  if (first === "domain" && segments.length >= 2) return { kind: "skip" }; // /domain/<id>
  if (first === "compare" && hasQuery) return { kind: "skip" }; // /compare?ids=…
  if (
    first === "today" &&
    segments.length >= 2 &&
    pathname !== "/today/archive"
  ) {
    return { kind: "skip" }; // /today/<date>
  }

  // --- a. /insight/<slug> ---
  if (first === "insight") {
    if (INSIGHT_ROOT_PATHS.has(pathname)) return { kind: "ok" };
    if (segments.length === 2 && INSIGHT_SLUGS.has(segments[1])) {
      return { kind: "ok" };
    }
    return {
      kind: "broken",
      category: "insight",
      reason: `INSIGHTS に存在しない Insight slug`,
    };
  }

  // --- b. /glossary/<slug> ---
  if (first === "glossary") {
    if (GLOSSARY_ROOT_PATHS.has(pathname)) return { kind: "ok" };
    if (segments.length === 2 && GLOSSARY_SLUGS.has(segments[1])) {
      return { kind: "ok" };
    }
    return {
      kind: "broken",
      category: "glossary",
      reason: `GLOSSARY_TERMS に存在しない用語 slug`,
    };
  }

  // --- c. 固定ルート ---
  if (FIXED_ROUTES.has(pathname)) return { kind: "ok" };
  return {
    kind: "broken",
    category: "fixed",
    reason: `未知の固定ルート（FIXED_ROUTES 未登録）`,
  };
}

interface BrokenLink {
  file: string;
  link: string;
  category: "insight" | "glossary" | "fixed";
  reason: string;
}

// src/app/insight/<slug>/page.mdx を全列挙（page.tsx のハブは対象外）。
function listMdxFiles(): string[] {
  return readdirSync(INSIGHT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(INSIGHT_DIR, d.name, "page.mdx"))
    .filter((p) => existsSync(p))
    .sort();
}

// 全 MDX を走査し、壊れたリンクを収集する。
function collectBrokenLinks(): { files: string[]; broken: BrokenLink[] } {
  const files = listMdxFiles();
  const broken: BrokenLink[] = [];
  for (const file of files) {
    const rel = path.relative(INSIGHT_DIR, file).replace(/\\/g, "/");
    const content = readFileSync(file, "utf8");
    for (const link of extractInternalLinks(content)) {
      const verdict = verifyLink(link);
      if (verdict.kind === "broken") {
        broken.push({
          file: rel,
          link,
          category: verdict.category,
          reason: verdict.reason,
        });
      }
    }
  }
  return { files, broken };
}

function formatBroken(items: BrokenLink[]): string {
  if (items.length === 0) return "(なし)";
  return items
    .map((b) => `  ${b.file}  →  ${b.link}  （${b.reason}）`)
    .join("\n");
}

const { files: MDX_FILES, broken: BROKEN } = collectBrokenLinks();

describe("extractInternalLinks", () => {
  test("Markdown リンクからサイト内絶対パスのみを抽出する", () => {
    const md =
      "見出し [A](/insight/foo) と [B](/glossary/bar)、[外部](https://example.com)、[アンカー](#sec) を含む文。";
    expect(extractInternalLinks(md)).toEqual(["/insight/foo", "/glossary/bar"]);
  });

  test("クエリ・ハッシュは保持し、タイトル付きは URL 部分のみ抽出する", () => {
    const md =
      '[x](/compare?ids=a,b) [y](/insight/z#chart) [t](/today "朝刊アーカイブ")';
    expect(extractInternalLinks(md)).toEqual([
      "/compare?ids=a,b",
      "/insight/z#chart",
      "/today",
    ]);
  });

  test("プロトコル相対・外部スキームは無視する", () => {
    const md = "[a](//cdn.example.com/x) [b](http://x.test) [c](mailto:a@b.com)";
    expect(extractInternalLinks(md)).toEqual([]);
  });
});

describe("MDX 内部リンク整合性（恒久ガード）", () => {
  test("MDX を実際に走査できている（空走で緑にならないための番人）", () => {
    // 105 本という具体値には依存しない下限チェック。
    expect(MDX_FILES.length).toBeGreaterThan(50);
  });

  test("壊れた /insight リンクが 0 件", () => {
    const items = BROKEN.filter((b) => b.category === "insight");
    expect(
      items,
      `存在しない Insight を指す内部リンク（${items.length} 件）:\n${formatBroken(items)}`,
    ).toHaveLength(0);
  });

  test("壊れた /glossary リンクが 0 件", () => {
    const items = BROKEN.filter((b) => b.category === "glossary");
    expect(
      items,
      `存在しない用語を指す内部リンク（${items.length} 件）:\n${formatBroken(items)}`,
    ).toHaveLength(0);
  });

  test("未知の固定ルートが 0 件", () => {
    const items = BROKEN.filter((b) => b.category === "fixed");
    expect(
      items,
      `FIXED_ROUTES に未登録の固定ルート（${items.length} 件）。実在ページなら FIXED_ROUTES へ追記、誤リンクなら本文修正:\n${formatBroken(items)}`,
    ).toHaveLength(0);
  });
});
