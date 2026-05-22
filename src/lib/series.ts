import { fetchCatalog, type Indicator } from "./catalog";

const SERIES_BASE =
  "https://raw.githubusercontent.com/kenjieda-eng/eic-data-pipeline/main/data/processed";

const RAW_BASE =
  "https://raw.githubusercontent.com/kenjieda-eng/eic-data-pipeline/main";

export interface SeriesPoint {
  date: string;
  value: number | null;
}

export interface SeriesMeta {
  id: string;
  name: string;
  unit: string;
  source_name: string;
  source_url: string;
  observation_cutoff: string;
  license: string;
  domain: string;
}

/**
 * indicator id → eic-data-pipeline の processed CSV 配下ディレクトリ名
 *
 * デフォルトは id の先頭セグメント (例: "fuel-lng-jp-cif" → "fuel") だが、
 * 以下の例外がある (catalog の domain ≠ pipeline ディレクトリ名):
 *   - us-treasury-*       → finance
 *   - meti-*              → enecho-power
 *   - us-cpi-yoy / us-fed-funds-rate / us-industrial-production → macro
 *     (Phase 3-B 第 2 弾 5/10 着地、`us-` 始まりだが macro/ 配置)
 *
 * Phase C Day 3 hotfix (2026-05-12): 米マクロ 3 系列が "us/" にフォールバックし
 * 404 を返していた問題を修正、L-013 累計 39 件目。
 *
 * download/all/route.ts などの外部からも参照する想定で export。
 */
const US_MACRO_IDS = new Set([
  "us-cpi-yoy",
  "us-fed-funds-rate",
  "us-industrial-production",
]);

export function idToDirectory(id: string): string {
  if (id.startsWith("us-treasury-")) return "finance";
  if (id.startsWith("meti-")) return "enecho-power";
  if (US_MACRO_IDS.has(id)) return "macro";
  const idx = id.indexOf("-");
  if (idx <= 0) {
    throw new Error(`Cannot derive directory for indicator id: ${id}`);
  }
  return id.slice(0, idx);
}

function toMeta(ind: Indicator): SeriesMeta {
  return {
    id: ind.id,
    name: ind.name,
    unit: ind.unit,
    source_name: ind.source_name,
    source_url: ind.source_url,
    observation_cutoff: ind.observation_cutoff,
    license: ind.license,
    domain: ind.domain,
  };
}

export async function fetchSeries(id: string): Promise<{
  meta: SeriesMeta;
  points: SeriesPoint[];
}> {
  const catalog = await fetchCatalog();
  const ind = catalog.indicators.find((i) => i.id === id);
  if (!ind) throw new Error(`Indicator not found in catalog: ${id}`);

  const url = ind.csv_path
    ? `${RAW_BASE}/${ind.csv_path}`
    : `${SERIES_BASE}/${idToDirectory(id)}/${id}.csv`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) {
    throw new Error(`Failed to fetch series ${id}: ${res.status} ${url}`);
  }

  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) {
    throw new Error(`Series ${id} has no data rows`);
  }

  const header = lines[0].split(",");
  const dateIdx = header.indexOf("date");
  const valueIdx = header.indexOf("value");
  if (dateIdx < 0 || valueIdx < 0) {
    throw new Error(
      `Series ${id} CSV header missing date/value: ${header.join(",")}`,
    );
  }

  const points: SeriesPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const date = cols[dateIdx];
    if (!date) continue;
    const raw = cols[valueIdx];
    const v = raw === undefined || raw === "" ? NaN : parseFloat(raw);
    points.push({ date, value: Number.isFinite(v) ? v : null });
  }

  return { meta: toMeta(ind), points };
}
