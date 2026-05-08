export interface CatalogFilters {
  domain: string | null;
  frequency: string | null;
  query: string;
}

export function parseFilters(
  raw: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const pickOne = (v: string | string[] | undefined): string | null => {
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };
  const domain = pickOne(raw.domain) || null;
  const frequency = pickOne(raw.frequency) || null;
  const query = pickOne(raw.q) || "";
  return { domain, frequency, query };
}

export function buildHref(
  filters: CatalogFilters,
  patch: Partial<CatalogFilters>,
): string {
  const next: CatalogFilters = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.domain) params.set("domain", next.domain);
  if (next.frequency) params.set("frequency", next.frequency);
  if (next.query) params.set("q", next.query);
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

export function toggleHref(
  filters: CatalogFilters,
  key: "domain" | "frequency",
  value: string,
): string {
  const current = filters[key];
  if (current === value) return buildHref(filters, { [key]: null });
  return buildHref(filters, { [key]: value });
}
