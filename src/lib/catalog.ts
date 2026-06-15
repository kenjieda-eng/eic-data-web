const CATALOG_URL =
  "https://raw.githubusercontent.com/kenjieda-eng/eic-data-pipeline/main/data/catalog/indicators.json";

export interface Indicator {
  id: string;
  name: string;
  domain: string;
  frequency: string;
  unit: string;
  source_name: string;
  source_url: string;
  license: string;
  observation_cutoff: string;
  updated_at: string;
  csv_path?: string;
  license_url?: string;
  license_notice?: string;
  tz?: string;
  missing_policy?: string;
  backfill_start?: string;
  publisher?: string;
  aggregation?: string;
  notes?: string;
  depends_on?: string | string[] | null;
  freshness_sla_days?: number;
}

export interface Catalog {
  version: number;
  schema: string;
  generated_at: string;
  indicator_count: number;
  indicators: Indicator[];
}

export async function fetchCatalog(): Promise<Catalog> {
  const res = await fetch(CATALOG_URL, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch catalog: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// =============================================================================
// Phase B-B Day 1: data-quality 集計ヘルパ
// モック側 #/data-quality (mockups/index-v2.html L2772-) の SLA / フィルタ仕様に追随。
// =============================================================================

export type SlaStatus = "healthy" | "warning" | "breach" | "unknown";

export interface EnrichedIndicator extends Indicator {
  ageDays: number | null;
  status: SlaStatus;
}

export interface DomainMeta {
  id: string;
  ja: string;
  emoji: string;
}

// 正準 12 ドメイン (pipeline catalog の実 domain ID に統一)。
// Polish #2 (2026-06-15) で旧 ID (geo/policy/demand/ir/intl/econ/electricity) を廃し、
// catalog `indicators.json` が出力する domain 文字列そのものに揃えた。emoji/ja 表示は踏襲。
const DOMAIN_TABLE: DomainMeta[] = [
  { id: "power", ja: "電力・電源", emoji: "🔌" },
  { id: "fuel", ja: "燃料", emoji: "🔥" },
  { id: "finance", ja: "金融", emoji: "💰" },
  { id: "weather", ja: "気象", emoji: "🌡️" },
  { id: "esg", ja: "ESG", emoji: "🌱" },
  { id: "tech", ja: "技術", emoji: "🔧" },
  { id: "geopolitics", ja: "地政", emoji: "🌏" },
  { id: "regulation", ja: "制度", emoji: "📜" },
  { id: "population", ja: "人口・需要", emoji: "👥" },
  { id: "corp_ir", ja: "企業IR", emoji: "📑" },
  { id: "international", ja: "国際", emoji: "🌐" },
  { id: "economy", ja: "経済", emoji: "📊" },
];

// 非正準な catalog domain 文字列 / 旧 web ID → 正準 ID のエイリアス。
// catalog の `macro` 系列 (米マクロ・日銀短観) は web では economy に内包して表示する。
const DOMAIN_ALIASES: Record<string, string> = {
  macro: "economy",
  electricity: "power",
  // 旧 web 短縮 ID (Polish #2 以前の drift) も防御的に解決
  geo: "geopolitics",
  policy: "regulation",
  demand: "population",
  ir: "corp_ir",
  intl: "international",
  econ: "economy",
  technology: "tech",
};

/** catalog domain 文字列 / 旧 ID を正準 12 ドメイン ID に解決 (未知はそのまま返す)。 */
export function canonicalDomain(id: string | undefined | null): string {
  if (!id) return "";
  return DOMAIN_ALIASES[id] ?? id;
}

export function domainOf(id: string | undefined | null): DomainMeta {
  const canonical = canonicalDomain(id);
  const found = DOMAIN_TABLE.find((d) => d.id === canonical);
  if (found) return found;
  return { id: id ?? "", ja: id ?? "不明", emoji: "❓" };
}

/** 正準 12 ドメインのメタ一覧 (表示順は DOMAIN_TABLE のまま)。 */
export function allDomains(): DomainMeta[] {
  return DOMAIN_TABLE;
}

const SPDX_PATTERN = /^(CC-BY|CC0|MIT|Apache|GPL|BSD|public-domain)/i;

export function isSpdxLicense(license: string | undefined | null): boolean {
  if (!license) return false;
  return SPDX_PATTERN.test(license);
}

const DAY_MS = 86400000;
const DEFAULT_SLA_DAYS = 30;

export function daysSinceCutoff(
  indicator: Pick<Indicator, "observation_cutoff">,
  now: Date = new Date(),
): number | null {
  if (!indicator.observation_cutoff) return null;
  const cutoff = new Date(indicator.observation_cutoff + "T00:00:00+09:00");
  if (Number.isNaN(cutoff.getTime())) return null;
  return Math.floor((now.getTime() - cutoff.getTime()) / DAY_MS);
}

export function slaStatusOf(
  indicator: Pick<Indicator, "observation_cutoff" | "freshness_sla_days">,
  now: Date = new Date(),
): { ageDays: number | null; status: SlaStatus } {
  const ageDays = daysSinceCutoff(indicator, now);
  if (ageDays === null) return { ageDays: null, status: "unknown" };
  const sla = indicator.freshness_sla_days ?? DEFAULT_SLA_DAYS;
  if (ageDays <= sla) return { ageDays, status: "healthy" };
  if (ageDays <= sla * 1.5) return { ageDays, status: "warning" };
  return { ageDays, status: "breach" };
}

export function enrichIndicators(
  indicators: Indicator[],
  now: Date = new Date(),
): EnrichedIndicator[] {
  return indicators.map((ind) => ({
    ...ind,
    ...slaStatusOf(ind, now),
  }));
}

export function filterByDomain<T extends { domain: string }>(
  rows: T[],
  domain: string | null | undefined,
): T[] {
  if (!domain) return rows;
  return rows.filter((r) => r.domain === domain);
}

/**
 * 正準 ドメイン ID で絞り込む (エイリアス解決つき)。
 * 例: filterByCanonicalDomain(rows, "economy") は domain==="economy" と
 * domain==="macro" の両方を拾う。
 */
export function filterByCanonicalDomain<T extends { domain: string }>(
  rows: T[],
  domain: string | null | undefined,
): T[] {
  if (!domain) return rows;
  return rows.filter((r) => canonicalDomain(r.domain) === domain);
}

/** 正準 ドメイン ID ごとの系列数 (macro→economy 等のエイリアスを畳み込む)。 */
export function countByCanonicalDomain(
  rows: Pick<Indicator, "domain">[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = canonicalDomain(r.domain);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function filterByStatus<T extends { status: SlaStatus }>(
  rows: T[],
  status: string | null | undefined,
): T[] {
  if (!status) return rows;
  return rows.filter((r) => r.status === status);
}

export function summarizeByDomain(
  rows: Pick<Indicator, "domain">[],
): { domain: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    counts.set(r.domain, (counts.get(r.domain) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);
}

export function summarizeByLicense(
  rows: Pick<Indicator, "license">[],
): { license: string; count: number; isSpdx: boolean }[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = r.license || "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([license, count]) => ({
      license,
      count,
      isSpdx: isSpdxLicense(license),
    }))
    .sort((a, b) => b.count - a.count);
}

export function summarizeStatus(
  rows: { status: SlaStatus }[],
): Record<SlaStatus, number> {
  const out: Record<SlaStatus, number> = {
    healthy: 0,
    warning: 0,
    breach: 0,
    unknown: 0,
  };
  for (const r of rows) out[r.status]++;
  return out;
}

export function recentlyUpdated(
  rows: Indicator[],
  days = 7,
  now: Date = new Date(),
): Indicator[] {
  const threshold = days * DAY_MS;
  return rows
    .filter((r) => {
      if (!r.updated_at) return false;
      const u = new Date(r.updated_at);
      if (Number.isNaN(u.getTime())) return false;
      return now.getTime() - u.getTime() <= threshold;
    })
    .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
}

// =============================================================================
// Phase B-B Day 2: catalog ページ向け検索 / 個別取得 / 依存関係逆引き
// =============================================================================

export function searchIndicators<T extends Pick<Indicator, "id" | "name">>(
  rows: T[],
  query: string | null | undefined,
): T[] {
  if (!query) return rows;
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      (r.id || "").toLowerCase().includes(q) ||
      (r.name || "").toLowerCase().includes(q),
  );
}

export function getIndicatorById(
  catalog: Catalog,
  id: string,
): Indicator | undefined {
  return catalog.indicators.find((i) => i.id === id);
}

function dependsOnList(value: Indicator["depends_on"]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

export function getDependsOn(indicator: Indicator): string[] {
  return dependsOnList(indicator.depends_on);
}

export function getDependentIndicators(
  catalog: Catalog,
  id: string,
): Indicator[] {
  return catalog.indicators.filter((i) => dependsOnList(i.depends_on).includes(id));
}

export function summarizeByFrequency(
  rows: Pick<Indicator, "frequency">[],
): { frequency: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = r.frequency || "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([frequency, count]) => ({ frequency, count }))
    .sort((a, b) => b.count - a.count);
}

export function filterByFrequency<T extends { frequency: string }>(
  rows: T[],
  frequency: string | null | undefined,
): T[] {
  if (!frequency) return rows;
  return rows.filter((r) => r.frequency === frequency);
}

export function crossDomainLicense(
  rows: Pick<Indicator, "domain" | "license">[],
): {
  domains: string[];
  licenses: string[];
  matrix: Record<string, Record<string, number>>;
} {
  const matrix: Record<string, Record<string, number>> = {};
  const domainSet = new Set<string>();
  const licenseSet = new Set<string>();
  for (const r of rows) {
    const d = r.domain || "unknown";
    const l = r.license || "unknown";
    domainSet.add(d);
    licenseSet.add(l);
    if (!matrix[d]) matrix[d] = {};
    matrix[d][l] = (matrix[d][l] ?? 0) + 1;
  }
  return {
    domains: [...domainSet].sort(),
    licenses: [...licenseSet].sort(),
    matrix,
  };
}
