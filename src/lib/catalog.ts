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
