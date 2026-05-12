/**
 * /cite 引用ジェネレータページ用のドメインロジック
 *
 * - SITE_CITATION: EIC Data 全体引用 (モード C)
 * - bibFilename: .bib / .txt ダウンロード ファイル名
 * - filterIndicatorsForCite: indicator の domain / frequency / licenseType / query 絞り込み
 * - licenseType: SPDX vs 独自の二分類
 *
 * 既存 `searchIndicators` / `searchInsights` は再利用、ここでは
 * /cite 固有のロジック (licenseType / SITE_CITATION / filename) のみを定義。
 */
import type { CitationFormat, CitationInput } from "./citation-formatter";
import { isSpdxLicense, type Indicator } from "./catalog";

export type LicenseType = "spdx" | "custom";

export function licenseTypeOf(license: string | undefined | null): LicenseType {
  return isSpdxLicense(license) ? "spdx" : "custom";
}

export const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  spdx: "SPDX (CC BY 等)",
  custom: "独自ライセンス",
};

export interface CiteFilters {
  query: string;
  domain: string | null;
  frequency: string | null;
  licenseType: LicenseType | null;
}

export const EMPTY_CITE_FILTERS: CiteFilters = {
  query: "",
  domain: null,
  frequency: null,
  licenseType: null,
};

export function filterIndicatorsForCite(
  indicators: Indicator[],
  filters: CiteFilters,
): Indicator[] {
  const q = filters.query.trim().toLowerCase();
  return indicators.filter((ind) => {
    if (filters.domain && ind.domain !== filters.domain) return false;
    if (filters.frequency && ind.frequency !== filters.frequency) return false;
    if (
      filters.licenseType &&
      licenseTypeOf(ind.license) !== filters.licenseType
    ) {
      return false;
    }
    if (q) {
      const hay =
        (ind.id || "").toLowerCase() + "\n" + (ind.name || "").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export const SITE_CITATION: CitationInput = {
  slug: "eic-data-platform",
  title: "EIC Data — 日本のエネルギーと金融の引用インフラ",
  kind: "indicator",
  sourceName: "EIC Data 公式サイト",
  sourceUrl: "https://data.eic-jp.org/",
  license: "CC BY 4.0",
};

export function bibFilename(
  slug: string,
  format: CitationFormat,
): string {
  const ext = format === "bibtex" ? "bib" : "txt";
  return `eic-data-${slug}.${ext}`;
}

export interface CiteGalleryExample {
  id: string;
  scene: string;
  audience: string;
  format: CitationFormat;
  sample: string;
  note: string;
}

export const CITE_GALLERY: CiteGalleryExample[] = [
  {
    id: "academic-bibtex",
    scene: "学術論文 (LaTeX)",
    audience: "研究者・大学院生",
    format: "bibtex",
    sample: [
      "@misc{eic-data-jepx-spot-tokyo,",
      "  title = {JEPX 東京スポット価格 (jepx-spot-tokyo)},",
      "  author = {EIC Data (一般社団法人エネルギー情報センター)},",
      "  year  = {2026},",
      "  url   = {https://data.eic-jp.org/catalog/jepx-spot-tokyo},",
      "  note  = {Accessed: 2026-05-13; License: CC BY 4.0},",
      "  publisher = {EIC Data}",
      "}",
    ].join("\n"),
    note: ".bib に追記して \\cite{eic-data-jepx-spot-tokyo} で参照。",
  },
  {
    id: "journalism-chicago",
    scene: "報道記事 (Chicago 17)",
    audience: "ジャーナリスト・編集者",
    format: "chicago",
    sample:
      'EIC Data (一般社団法人エネルギー情報センター). 2026. "米 CPI × USD/JPY (us-cpi-vs-fx)." Accessed May 13, 2026. https://data.eic-jp.org/insight/us-cpi-vs-fx. License: CC BY 4.0.',
    note: "本文中で「EIC Data によれば…」と書き、脚注に Chicago 17 形式で原典明示。",
  },
  {
    id: "finance-apa",
    scene: "金融レポート (APA 7)",
    audience: "アナリスト・トレーディング会社",
    format: "apa",
    sample:
      "EIC Data (一般社団法人エネルギー情報センター). (2026). EIC Data — 日本のエネルギーと金融の引用インフラ (eic-data-platform) [Data set]. Retrieved May 13, 2026, from https://data.eic-jp.org/ License: CC BY 4.0.",
    note: "参考文献リスト末尾に APA 7 で記載、本文中は「(EIC Data, 2026)」。",
  },
];
