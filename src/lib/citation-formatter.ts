/**
 * 引用フォーマット 3 形式 (BibTeX / Chicago 17 / APA 7) 自動生成 — Phase C Day 3 で実装
 *
 * 北極星「2 クリックで元データに辿れる」の真価実装。ジャーナリスト・研究者・
 * トレーディング会社が EIC Data の indicator / Insight を学術引用形式でコピー可能に。
 *
 * リク監修ポイント:
 *   1. ライセンス表示は CC BY 4.0 (一般社団法人エネルギー情報センター) を明示
 *   2. 「accessed_at」は generateCitation 呼び出し時の現在日時を動的取得
 *   3. 一次出典 (source_name + source_url) は Insight/indicator の本体表示と整合
 *   4. publisher = EIC Data、author = EIC Data (一般社団法人エネルギー情報センター)
 *   5. BibTeX の key は `eic-data-<slug>` で一意化、ASCII 限定
 */

export type CitationFormat = "bibtex" | "chicago" | "apa";

export interface CitationInput {
  /** 一意 slug (例: "jepx-spot-tokyo" or "us-cpi-vs-fx") */
  slug: string;
  /** ページタイトル (例: "JEPX 東京スポット価格" or "米 CPI × USD/JPY") */
  title: string;
  /** リソース種別 (Indicator API or Insight 記事) */
  kind: "indicator" | "insight";
  /** 一次出典名 (例: "JEPX スポット価格（日次サマリ）") - 任意 */
  sourceName?: string;
  /** 一次出典 URL - 任意 */
  sourceUrl?: string;
  /** ライセンス (例: "CC BY 4.0") - 任意、未指定時は CC BY 4.0 */
  license?: string;
  /** 引用元 URL ベース (省略時は https://data.eic-jp.org) */
  baseUrl?: string;
  /** 公開年 (省略時は現在年) */
  year?: number;
  /** アクセス日 ISO 8601 YYYY-MM-DD (省略時は現在日) */
  accessedAt?: string;
}

const DEFAULT_BASE = "https://data.eic-jp.org";
const DEFAULT_LICENSE = "CC BY 4.0";
const AUTHOR_FULL = "EIC Data (一般社団法人エネルギー情報センター)";
const AUTHOR_BIBTEX_BRACED = "{EIC Data (一般社団法人エネルギー情報センター)}";

function normalize(input: CitationInput): Required<
  Omit<CitationInput, "sourceName" | "sourceUrl">
> & Pick<CitationInput, "sourceName" | "sourceUrl"> {
  const now = new Date();
  return {
    slug: input.slug,
    title: input.title,
    kind: input.kind,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    license: input.license ?? DEFAULT_LICENSE,
    baseUrl: input.baseUrl ?? DEFAULT_BASE,
    year: input.year ?? now.getUTCFullYear(),
    accessedAt: input.accessedAt ?? now.toISOString().slice(0, 10),
  };
}

function resourceUrl(slug: string, kind: "indicator" | "insight", base: string): string {
  return kind === "indicator"
    ? `${base}/catalog/${slug}`
    : `${base}/insight/${slug}`;
}

const MONTH_NAMES_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatChicagoAccessed(accessedAt: string): string {
  const [y, m, d] = accessedAt.split("-").map((s) => Number(s));
  return `${MONTH_NAMES_LONG[m - 1]} ${d}, ${y}`;
}

function formatApaAccessed(accessedAt: string): string {
  const [y, m, d] = accessedAt.split("-").map((s) => Number(s));
  return `${MONTH_NAMES_LONG[m - 1]} ${d}, ${y}`;
}

export function generateBibtex(input: CitationInput): string {
  const n = normalize(input);
  const url = resourceUrl(n.slug, n.kind, n.baseUrl);
  // BibTeX key は ASCII 限定で一意化
  const key = `eic-data-${n.slug}`;
  const titleWithSlug = `${n.title} (${n.slug})`;
  const noteParts: string[] = [`Accessed: ${n.accessedAt}`, `License: ${n.license}`];
  if (n.sourceName) noteParts.push(`Primary source: ${n.sourceName}`);
  return [
    `@misc{${key},`,
    `  title = {${titleWithSlug}},`,
    `  author = ${AUTHOR_BIBTEX_BRACED},`,
    `  year = {${n.year}},`,
    `  url = {${url}},`,
    `  note = {${noteParts.join("; ")}},`,
    `  publisher = {EIC Data}`,
    `}`,
  ].join("\n");
}

export function generateChicago(input: CitationInput): string {
  const n = normalize(input);
  const url = resourceUrl(n.slug, n.kind, n.baseUrl);
  const titleWithSlug = `${n.title} (${n.slug})`;
  const accessed = formatChicagoAccessed(n.accessedAt);
  const tail = n.sourceName
    ? `Primary source: ${n.sourceName}. License: ${n.license}.`
    : `License: ${n.license}.`;
  return `${AUTHOR_FULL}. ${n.year}. "${titleWithSlug}." Accessed ${accessed}. ${url}. ${tail}`;
}

export function generateApa(input: CitationInput): string {
  const n = normalize(input);
  const url = resourceUrl(n.slug, n.kind, n.baseUrl);
  const titleWithSlug = `${n.title} (${n.slug})`;
  const accessed = formatApaAccessed(n.accessedAt);
  const kindTag = n.kind === "indicator" ? "[Data set]" : "[Insight]";
  const tail = n.sourceName
    ? `Primary source: ${n.sourceName}. License: ${n.license}.`
    : `License: ${n.license}.`;
  return `${AUTHOR_FULL}. (${n.year}). ${titleWithSlug} ${kindTag}. Retrieved ${accessed}, from ${url} ${tail}`;
}

export function generateCitation(
  input: CitationInput,
  format: CitationFormat,
): string {
  switch (format) {
    case "bibtex":
      return generateBibtex(input);
    case "chicago":
      return generateChicago(input);
    case "apa":
      return generateApa(input);
  }
}

export const CITATION_FORMAT_LABELS: Record<CitationFormat, string> = {
  bibtex: "BibTeX",
  chicago: "Chicago 17",
  apa: "APA 7",
};
