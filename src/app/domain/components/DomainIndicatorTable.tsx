import Link from "next/link";
import { isSpdxLicense, type EnrichedIndicator, type SlaStatus } from "@/lib/catalog";
import {
  groupIndicatorsBySubcategory,
  type DomainPageMeta,
} from "../data";

interface DomainIndicatorTableProps {
  meta: DomainPageMeta;
  rows: EnrichedIndicator[];
}

const TH =
  "px-3 py-2 text-[10px] uppercase tracking-wider text-faint font-medium whitespace-nowrap";
const TD = "px-3 py-2 text-[12px] align-top";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "日次",
  weekly: "週次",
  monthly: "月次",
  quarterly: "四半期",
  annual: "年次",
};

const STATUS_LABELS: Record<SlaStatus, { label: string; cls: string }> = {
  healthy: { label: "Healthy", cls: "text-emerald-700 bg-emerald-50" },
  warning: { label: "Warning", cls: "text-amber-700 bg-amber-50" },
  breach: { label: "Breach", cls: "text-rose-700 bg-rose-50" },
  unknown: { label: "Unknown", cls: "text-slate-500 bg-slate-100" },
};

function IndicatorRows({ rows }: { rows: EnrichedIndicator[] }) {
  return (
    <tbody>
      {rows.map((r) => {
        const licCls = isSpdxLicense(r.license)
          ? "text-emerald-700 bg-emerald-50"
          : "text-amber-700 bg-amber-50";
        const status = STATUS_LABELS[r.status];
        return (
          <tr
            key={r.id}
            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
          >
            <td className={`${TD} tabular-nums whitespace-nowrap`}>
              <Link
                href={`/catalog/${r.id}`}
                className="text-emerald-700 hover:text-emerald-800 underline"
              >
                {r.id}
              </Link>
            </td>
            <td className={`${TD} text-ink`}>{r.name || "—"}</td>
            <td className={`${TD} text-faint whitespace-nowrap`}>
              {FREQUENCY_LABELS[r.frequency] ?? r.frequency ?? "—"}
            </td>
            <td className={`${TD} tabular-nums text-subink whitespace-nowrap`}>
              {r.unit || "—"}
            </td>
            <td className={`${TD} tabular-nums text-subink whitespace-nowrap`}>
              {r.observation_cutoff || "—"}
            </td>
            <td className={`${TD} tabular-nums text-subink whitespace-nowrap`}>
              {r.ageDays === null ? "—" : `${r.ageDays} 日前`}
            </td>
            <td className={`${TD} text-[10px] whitespace-nowrap`}>
              <span className={`px-1.5 py-0.5 rounded ${status.cls}`}>
                {status.label}
              </span>
            </td>
            <td className={`${TD} text-[10px] whitespace-nowrap`}>
              <span className={`px-1.5 py-0.5 rounded ${licCls}`}>
                {r.license || "—"}
              </span>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}

function TableHead() {
  return (
    <thead className="bg-slate-50 border-b border-slate-200">
      <tr>
        <th className={TH}>ID</th>
        <th className={TH}>名称</th>
        <th className={TH}>頻度</th>
        <th className={TH}>単位</th>
        <th className={TH}>最終確定</th>
        <th className={TH}>経過</th>
        <th className={TH}>SLA</th>
        <th className={TH}>ライセンス</th>
      </tr>
    </thead>
  );
}

export default function DomainIndicatorTable({ meta, rows }: DomainIndicatorTableProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-8 text-center text-faint text-sm">
        このドメインに該当する系列がまだありません。
      </div>
    );
  }

  const groups = groupIndicatorsBySubcategory(meta, rows);
  const groupedIds = new Set(groups.flatMap((g) => g.rows.map((r) => r.id)));
  const ungrouped = rows.filter((r) => !groupedIds.has(r.id));

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.sub.name}>
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-[13px] font-semibold text-ink">
              {g.sub.name}
              <span className="ml-2 text-[11px] text-faint tabular-nums">
                {g.rows.length} 系列
              </span>
            </h3>
            <p className="text-[11px] text-faint">{g.sub.description}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-md overflow-x-auto">
            <table className="w-full text-left">
              <TableHead />
              <IndicatorRows rows={g.rows} />
            </table>
          </div>
        </section>
      ))}

      {ungrouped.length > 0 && (
        <section>
          <div className="mb-2">
            <h3 className="text-[13px] font-semibold text-ink">
              その他
              <span className="ml-2 text-[11px] text-faint tabular-nums">
                {ungrouped.length} 系列
              </span>
            </h3>
          </div>
          <div className="bg-white border border-slate-200 rounded-md overflow-x-auto">
            <table className="w-full text-left">
              <TableHead />
              <IndicatorRows rows={ungrouped} />
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
