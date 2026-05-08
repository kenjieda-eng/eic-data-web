import Link from "next/link";
import {
  domainOf,
  isSpdxLicense,
  type EnrichedIndicator,
} from "@/lib/catalog";

interface CatalogTableProps {
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

export default function CatalogTable({ rows }: CatalogTableProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-8 text-center text-faint text-sm">
        該当する系列がありません。検索キーワードかフィルタを変更してください。
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
            <th className={TH}>単位</th>
            <th className={TH}>出典</th>
            <th className={TH}>最終確定</th>
            <th className={TH}>ライセンス</th>
            <th className={TH}>詳細</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const dom = domainOf(r.domain);
            const licClass = isSpdxLicense(r.license)
              ? "text-emerald-700 bg-emerald-50"
              : "text-amber-700 bg-amber-50";
            return (
              <tr
                key={r.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td
                  className={`${TD} tabular-nums whitespace-nowrap`}
                >
                  <Link
                    href={`/catalog/${r.id}`}
                    className="text-emerald-700 hover:text-emerald-800 underline"
                  >
                    {r.id}
                  </Link>
                </td>
                <td className={`${TD} text-ink`}>{r.name || "—"}</td>
                <td className={`${TD} text-subink whitespace-nowrap`}>
                  <span aria-hidden>{dom.emoji}</span> {dom.ja}
                </td>
                <td className={`${TD} text-faint whitespace-nowrap`}>
                  {FREQUENCY_LABELS[r.frequency] ?? r.frequency ?? "—"}
                </td>
                <td className={`${TD} tabular-nums text-subink whitespace-nowrap`}>
                  {r.unit || "—"}
                </td>
                <td className={`${TD} text-subink truncate max-w-[160px]`}>
                  {r.source_name || "—"}
                </td>
                <td
                  className={`${TD} tabular-nums text-subink whitespace-nowrap`}
                >
                  {r.observation_cutoff || "—"}
                </td>
                <td className={`${TD} text-[10px] whitespace-nowrap`}>
                  <span className={`px-1.5 py-0.5 rounded ${licClass}`}>
                    {r.license || "—"}
                  </span>
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  <Link
                    href={`/catalog/${r.id}`}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 underline"
                  >
                    詳細 →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
