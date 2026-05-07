import type { SlaStatus } from "@/lib/catalog";

export const STATUS_LABELS: Record<SlaStatus, string> = {
  healthy: "🟢 健全",
  warning: "🟡 警告",
  breach: "🔴 SLA 違反",
  unknown: "⚪ 不明",
};

export const STATUS_COLORS: Record<SlaStatus, string> = {
  healthy: "#16a34a",
  warning: "#d97706",
  breach: "#dc2626",
  unknown: "#94a3b8",
};

export interface DataQualityFilters {
  domain: string | null;
  status: SlaStatus | null;
}

const STATUS_VALUES: SlaStatus[] = ["healthy", "warning", "breach", "unknown"];

export function parseFilters(
  raw: Record<string, string | string[] | undefined>,
): DataQualityFilters {
  const pickOne = (v: string | string[] | undefined): string | null => {
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };
  const domain = pickOne(raw.domain) || null;
  const statusRaw = pickOne(raw.status);
  const status =
    statusRaw && (STATUS_VALUES as string[]).includes(statusRaw)
      ? (statusRaw as SlaStatus)
      : null;
  return { domain, status };
}

export function buildHref(
  filters: DataQualityFilters,
  patch: Partial<DataQualityFilters>,
): string {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.domain) params.set("domain", next.domain);
  if (next.status) params.set("status", next.status);
  const qs = params.toString();
  return qs ? `/data-quality?${qs}` : "/data-quality";
}

export function toggleHref(
  filters: DataQualityFilters,
  key: keyof DataQualityFilters,
  value: string,
): string {
  const current = filters[key];
  if (current === value) {
    return buildHref(filters, { [key]: null } as Partial<DataQualityFilters>);
  }
  return buildHref(filters, { [key]: value } as Partial<DataQualityFilters>);
}
