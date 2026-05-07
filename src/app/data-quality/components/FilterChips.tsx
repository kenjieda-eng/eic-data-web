import Link from "next/link";
import { domainOf, type SlaStatus } from "@/lib/catalog";
import {
  buildHref,
  toggleHref,
  STATUS_LABELS,
  type DataQualityFilters,
} from "../filters";

interface FilterChipsProps {
  filters: DataQualityFilters;
  domainCounts: { domain: string; count: number }[];
  statusCounts: Record<SlaStatus, number>;
  total: number;
  shown: number;
}

const CHIP =
  "inline-flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full border border-slate-200 bg-white text-subink hover:border-emerald-500 hover:text-emerald-700 transition-colors";
const CHIP_ACTIVE =
  "inline-flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full border border-emerald-500 bg-emerald-50 text-emerald-700";

export default function FilterChips({
  filters,
  domainCounts,
  statusCounts,
  total,
  shown,
}: FilterChipsProps) {
  const hasFilter = Boolean(filters.domain || filters.status);

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 mb-4">
      <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
        ドメインで絞る
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {domainCounts.map(({ domain, count }) => {
          const dom = domainOf(domain);
          const active = filters.domain === domain;
          return (
            <Link
              key={domain}
              href={toggleHref(filters, "domain", domain)}
              className={active ? CHIP_ACTIVE : CHIP}
              aria-pressed={active}
            >
              <span aria-hidden>{dom.emoji}</span>
              <span>{dom.ja}</span>
              <span className="tabular-nums text-faint">{count}</span>
            </Link>
          );
        })}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
        SLA ステータスで絞る
      </div>
      <div className="flex flex-wrap gap-2">
        {(["healthy", "warning", "breach"] as SlaStatus[]).map((s) => {
          const active = filters.status === s;
          return (
            <Link
              key={s}
              href={toggleHref(filters, "status", s)}
              className={active ? CHIP_ACTIVE : CHIP}
              aria-pressed={active}
            >
              <span>{STATUS_LABELS[s]}</span>
              <span className="tabular-nums text-faint">{statusCounts[s]}</span>
            </Link>
          );
        })}
      </div>
      {hasFilter && (
        <div className="mt-3 flex items-center gap-2 text-[12px]">
          <Link
            href={buildHref({ domain: null, status: null }, {})}
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            フィルタをクリア
          </Link>
          <span className="text-faint">
            表示中: {shown} / {total} 系列
          </span>
        </div>
      )}
    </div>
  );
}
