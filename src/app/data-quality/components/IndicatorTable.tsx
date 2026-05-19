import {
  domainOf,
  isSpdxLicense,
  type EnrichedIndicator,
} from "@/lib/catalog";
import { STATUS_COLORS, STATUS_LABELS, STATUS_TEXT_COLORS } from "../filters";

interface IndicatorTableProps {
  rows: EnrichedIndicator[];
}

const TH =
  "px-3 py-2 text-[10px] uppercase tracking-wider text-faint font-medium whitespace-nowrap";
const TD = "px-3 py-2 text-[12px] align-top";

export default function IndicatorTable({ rows }: IndicatorTableProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-8 text-center text-faint text-sm">
        該当する系列がありません。フィルタを変更してください。
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-md overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className={TH}>ID</th>
            <th className={TH}>名称</th>
            <th className={TH}>ドメイン</th>
            <th className={TH}>頻度</th>
            <th className={TH}>最終確定</th>
            <th className={TH}>経過</th>
            <th className={TH}>SLA</th>
            <th className={TH}>ライセンス</th>
            <th className={TH}>出典</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const dom = domainOf(r.domain);
            const ageText = r.ageDays === null ? "—" : `${r.ageDays}日前`;
            const licClass = isSpdxLicense(r.license)
              ? "text-emerald-700 bg-emerald-50"
              : "text-amber-700 bg-amber-50";
            const statusColor = STATUS_COLORS[r.status];
            const statusTextColor = STATUS_TEXT_COLORS[r.status];
            return (
              <tr
                key={r.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className={`${TD} tabular-nums text-faint whitespace-nowrap`}>
                  {r.id}
                </td>
                <td className={`${TD} text-ink`}>{r.name || "—"}</td>
                <td className={`${TD} text-subink whitespace-nowrap`}>
                  <span aria-hidden>{dom.emoji}</span> {dom.ja}
                </td>
                <td className={`${TD} text-faint whitespace-nowrap`}>
                  {r.frequency || "—"}
                </td>
                <td
                  className={`${TD} tabular-nums text-subink whitespace-nowrap`}
                >
                  {r.observation_cutoff || "—"}
                </td>
                <td className={`${TD} text-faint whitespace-nowrap`}>
                  {ageText}
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-medium tracking-wider"
                    style={{
                      background: `${statusColor}20`,
                      color: statusTextColor,
                    }}
                  >
                    {STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className={`${TD} text-[10px] whitespace-nowrap`}>
                  <span className={`px-1.5 py-0.5 rounded ${licClass}`}>
                    {r.license || "—"}
                  </span>
                </td>
                <td className={`${TD} text-[11px] whitespace-nowrap`}>
                  {r.source_url ? (
                    <a
                      href={r.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 underline hover:text-emerald-800"
                    >
                      出典 →
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
