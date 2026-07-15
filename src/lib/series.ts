import { fetchCatalog, type Indicator } from "./catalog";
import { fetchWithRetry } from "./fetch-retry";

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

/**
 * /api/indicator/<id> のレスポンス（クライアント経由取得時）。
 * route.ts は catalog の Indicator を top-level に spread し、時系列を `data` に、
 * レスポンス自体のメタ（生成時刻・series_error 等）を `meta` に載せる。
 * SeriesMeta の必須 8 フィールドはすべて top-level に含まれる。
 */
interface IndicatorApiResponse {
  data?: unknown;
  error?: unknown;
  meta?: unknown;
  [key: string]: unknown;
}

const SERIES_META_FIELDS: readonly (keyof SeriesMeta)[] = [
  "id",
  "name",
  "unit",
  "source_name",
  "source_url",
  "observation_cutoff",
  "license",
  "domain",
];

/**
 * /api/indicator/<id> のレスポンス JSON を { meta, points } に変換する純関数。
 *
 * - API がエラー本文 (`error`) を返した場合、または CSV 取得に失敗して
 *   `meta.series_error` が付いている場合は throw する（チャート側の error 表示を
 *   現行の raw 直 fetch 時と同様に活かすため）。
 * - SeriesMeta の必須フィールドが欠けている場合も throw する。
 *
 * fetch 分離のため純関数として切り出し、単体テスト可能にしている。
 */
export function adaptIndicatorResponse(
  id: string,
  json: unknown,
): { meta: SeriesMeta; points: SeriesPoint[] } {
  if (!json || typeof json !== "object") {
    throw new Error(`Invalid indicator response for ${id}`);
  }
  const body = json as IndicatorApiResponse;

  // 404 / 502 / 429 などは本文に `error` を持つ。
  if (typeof body.error === "string" && body.error) {
    throw new Error(`Failed to fetch indicator ${id}: ${body.error}`);
  }

  // サーバー側で CSV 取得に失敗すると 200 + data:[] + meta.series_error になる。
  const respMeta = body.meta;
  if (respMeta && typeof respMeta === "object") {
    const seriesError = (respMeta as { series_error?: unknown }).series_error;
    if (typeof seriesError === "string" && seriesError) {
      throw new Error(`Failed to fetch series ${id}: ${seriesError}`);
    }
  }

  const meta = {} as SeriesMeta;
  for (const field of SERIES_META_FIELDS) {
    const value = body[field];
    if (typeof value !== "string") {
      throw new Error(`Indicator response ${id} missing field: ${field}`);
    }
    meta[field] = value;
  }

  if (!Array.isArray(body.data)) {
    throw new Error(`Indicator response ${id} missing data array`);
  }
  const points: SeriesPoint[] = [];
  for (const row of body.data) {
    const r = (row ?? {}) as { date?: unknown; value?: unknown };
    if (typeof r.date !== "string" || !r.date) continue;
    const v = r.value;
    points.push({
      date: r.date,
      value: typeof v === "number" && Number.isFinite(v) ? v : null,
    });
  }

  return { meta, points };
}

export async function fetchSeries(id: string): Promise<{
  meta: SeriesMeta;
  points: SeriesPoint[];
}> {
  // クライアント (ブラウザ) では GitHub raw を直接叩かず、自前の
  // /api/indicator/<id> (Vercel CDN / Cache-Control s-maxage 済み) を経由する。
  // これで raw.githubusercontent の同一 IP レート制限 (429) を回避する。
  // GitHub への実アクセスはサーバー側 (build/ISR、下の Next fetch キャッシュ済み経路) だけに閉じる。
  if (typeof window !== "undefined") {
    const res = await fetch(`/api/indicator/${encodeURIComponent(id)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch series ${id}: ${res.status}`);
    }
    return adaptIndicatorResponse(id, await res.json());
  }

  // サーバー側 (build/ISR): 従来どおり raw.githubusercontent を直 fetch。
  const catalog = await fetchCatalog();
  const ind = catalog.indicators.find((i) => i.id === id);
  if (!ind) throw new Error(`Indicator not found in catalog: ${id}`);

  const url = ind.csv_path
    ? `${RAW_BASE}/${ind.csv_path}`
    : `${SERIES_BASE}/${idToDirectory(id)}/${id}.csv`;
  // 毎朝9時台のnightly後、10時台にはチャート反映させるため 24h → 1h に短縮。
  const res = await fetchWithRetry(url, { next: { revalidate: 3600 } });
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
